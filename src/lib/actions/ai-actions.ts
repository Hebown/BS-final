'use server'

import { pipeline } from '@huggingface/transformers'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// 使用文件系统缓存，而不是内存缓存
// @huggingface/transformers 会自动将模型文件缓存到磁盘
// 默认位置：~/.cache/huggingface/transformers 或 process.cwd()/.cache/huggingface/transformers
// 这样可以避免在内存中保存大型模型实例
let classifierLoading: Promise<any> | null = null

/**
 * 获取或加载分类器（使用文件系统缓存）
 * 
 * 注意：
 * - 模型文件会自动缓存在磁盘上，不需要在内存中缓存整个 pipeline 实例
 * - 首次加载时会下载模型文件（约几百MB），需要一些时间
 * - 后续加载会从磁盘缓存读取，速度会快很多
 * - 使用并发锁确保同一时间只有一个加载操作
 */
async function getClassifier() {
  // 如果正在加载，等待加载完成
  if (classifierLoading) {
    return classifierLoading
  }

  // 开始加载分类器
  // 注意：使用 Xenova 提供的 ONNX 格式模型（@huggingface/transformers 需要 ONNX 格式）
  // openai/clip-vit-base-patch32 没有 ONNX 版本，所以使用 Xenova 的版本
  // 模型文件会自动缓存到磁盘，不需要在内存中保存
  classifierLoading = pipeline(
    'zero-shot-image-classification',
    'Xenova/clip-vit-base-patch32', // Xenova 提供了 ONNX 格式的模型
    {
      // 可选：指定缓存目录（默认使用系统缓存目录）
      // cache_dir: path.join(process.cwd(), '.cache', 'huggingface', 'transformers')
    }
  ).then(classifier => {
    // 加载完成后清除加载状态，但不缓存实例
    // 让 pipeline 实例在使用后被垃圾回收，避免占用大量内存
    classifierLoading = null
    return classifier
  }).catch(error => {
    classifierLoading = null
    console.error('分类器加载失败:', error)
    if (error instanceof Error) {
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
    }
    throw error
  })

  return classifierLoading
}

/**
 * 将图片 URL 转换为 Buffer（用于本地模型处理）
 * @huggingface/transformers 可以直接接受 URL 或 Buffer
 */
async function imageUrlToBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error converting image to buffer:', error)
    throw error
  }
}

/**
 * 使用零样本图片分类模型分析图片并生成多类型标签（风景、人物、动物等）
 * @param imageId 图片ID
 * @param imageUrl 图片URL（Cloudinary secure_url）
 * @returns 分析结果
 */
export async function analyzeImageWithAI(
  imageId: string,
  imageUrl: string
): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    // 检查用户认证
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 验证图片是否属于当前用户
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: { user: true }
    })

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权访问此图片'
      }
    }

    // CLIP 模型基于英文训练，使用英文标签效果更好
    // 定义英文候选标签列表和对应的中文映射
    const labelMapping: Record<string, string> = {
      'landscape': '风景',
      'person': '人物',
      'people': '人物',
      'animal': '动物',
      'building': '建筑',
      'architecture': '建筑',
      'food': '食物',
      'vehicle': '车辆',
      'car': '车辆',
      'plant': '植物',
      'sky': '天空',
      'ocean': '海洋',
      'sea': '海洋',
      'city': '城市',
      'urban': '城市',
      'nature': '自然',
      'indoor': '室内',
      'outdoor': '户外',
      'flower': '花卉',
      'tree': '树木',
      'mountain': '山水',
      'water': '山水',
      'night': '夜景',
      'night scene': '夜景',
      'day': '日景',
      'daytime': '日景',
      'sunset': '日落',
      'sunrise': '日出',
      'portrait': '肖像',
      'wildlife': '野生动物',
      'pet': '宠物',
      'street': '街道',
      'park': '公园',
      'beach': '海滩',
      'forest': '森林',
      'garden': '花园'
    }
    
    // 使用英文标签进行分类（CLIP 模型对英文支持更好）
    const candidateLabels = [
      'landscape', 'person', 'people', 'animal', 'building', 'architecture',
      'food', 'vehicle', 'car', 'plant', 'sky', 'ocean', 'sea',
      'city', 'urban', 'nature', 'indoor', 'outdoor', 'flower', 'tree',
      'mountain', 'water', 'night', 'night scene', 'day', 'daytime',
      'sunset', 'sunrise', 'portrait', 'wildlife', 'pet', 'street',
      'park', 'beach', 'forest', 'garden'
    ]

    // 获取分类器（带缓存）
    console.log('开始加载分类器...')
    const classifier = await getClassifier()
    console.log('分类器加载完成')

    // @huggingface/transformers 可以直接接受 URL 字符串或 Buffer
    // 先尝试直接使用 URL（更高效，不需要下载图片）
    // 如果 URL 方式失败（如 CORS 问题），则转换为 Buffer
    console.log('开始进行图片分类，候选标签数量:', candidateLabels.length)
    let results: any
    
    try {
      // 尝试直接使用 URL
      results = await classifier(imageUrl, candidateLabels)
    } catch (urlError) {
      // 如果 URL 方式失败（可能是 CORS 或网络问题），尝试使用 Buffer
      const errorMsg = urlError instanceof Error ? urlError.message : String(urlError)
      // 截断过长的错误消息，避免输出大量 base64 字符串
      const truncatedMsg = errorMsg.length > 200 ? errorMsg.substring(0, 200) + '...' : errorMsg
      console.log('URL 方式失败，尝试使用 Buffer...', truncatedMsg)
      const imageBuffer = await imageUrlToBuffer(imageUrl)
      results = await classifier(imageBuffer, candidateLabels)
    }
    
    console.log('分类完成，结果数量:', Array.isArray(results) ? results.length : 1)
    
    // 输出模型返回的原始结果（用于调试）
    console.log('=== 模型原始返回结果 ===')
    console.log(JSON.stringify(results, null, 2))
    console.log('========================')

    // 处理结果：results 是一个数组，每个元素包含 label 和 score
    // 按得分排序并过滤低分标签
    const sortedResults = Array.isArray(results) 
      ? results 
      : [results]
    
    // 输出排序前的所有结果
    console.log('=== 排序前的所有结果 ===')
    sortedResults.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.label || 'N/A'}: ${item.score || 'N/A'}`)
    })
    console.log('========================')
    
    const filteredResults = sortedResults
      .filter((item: any) => item.score > 0.3) // 过滤得分低于0.3的标签
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10) // 最多选择10个标签

    // 输出过滤和排序后的结果
    console.log('=== 过滤和排序后的结果 ===')
    filteredResults.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.label || 'N/A'}: ${item.score || 'N/A'}`)
    })
    console.log('========================')

    // 将英文标签映射回中文
    const aiTags = filteredResults
      .map((item: any) => {
        const englishLabel = item.label?.toLowerCase() || ''
        // 尝试直接映射
        if (labelMapping[englishLabel]) {
          const chineseTag = labelMapping[englishLabel]
          console.log(`标签映射: ${item.label} (${item.score}) -> ${chineseTag}`)
          return chineseTag
        }
        // 尝试部分匹配（处理 "night scene" 这样的多词标签）
        for (const [en, zh] of Object.entries(labelMapping)) {
          if (englishLabel.includes(en) || en.includes(englishLabel)) {
            console.log(`标签映射（部分匹配）: ${item.label} (${item.score}) -> ${zh}`)
            return zh
          }
        }
        // 如果找不到映射，返回原始标签（可能是中文或未识别的英文）
        console.log(`标签未映射，使用原始标签: ${item.label} (${item.score})`)
        return item.label
      })
      .filter((tag: string) => tag) // 过滤空标签

    console.log('=== 最终要保存的标签 ===')
    console.log(aiTags)
    console.log('========================')

    if (aiTags.length === 0) {
      return {
        success: true,
        tags: [],
        error: '未能生成有效的标签'
      }
    }

    // 批量查找或创建标签
    console.log('开始查找或创建标签...')
    const existingTags = await prisma.tag.findMany({
      where: { name: { in: aiTags } }
    })
    console.log(`找到 ${existingTags.length} 个已存在的标签:`, existingTags.map(t => t.name))
    
    const existingTagMap = new Map(existingTags.map(t => [t.name, t]))

    // 创建不存在的标签
    const tagsToCreate = aiTags.filter(name => !existingTagMap.has(name))
    if (tagsToCreate.length > 0) {
      console.log(`创建 ${tagsToCreate.length} 个新标签:`, tagsToCreate)
      await prisma.tag.createMany({
        data: tagsToCreate.map(name => ({ name })),
        skipDuplicates: true
      })
    } else {
      console.log('所有标签都已存在，无需创建新标签')
    }

    // 重新查询所有标签（包括新创建的）
    const allTags = await prisma.tag.findMany({
      where: { name: { in: aiTags } }
    })
    console.log(`获取到 ${allTags.length} 个标签用于关联:`, allTags.map(t => t.name))

    // 获取现有图片标签，避免重复
    const existingImageTags = await prisma.imageTag.findMany({
      where: { imageId: imageId }
    })
    const existingImageTagIds = new Set(existingImageTags.map(it => it.tagId))
    console.log(`图片已有 ${existingImageTags.length} 个标签关联`)

    // 创建图片标签关联（只创建不存在的）
    const newTagIds = allTags
      .filter(tag => !existingImageTagIds.has(tag.id))
      .map(tag => tag.id)

    if (newTagIds.length > 0) {
      console.log(`创建 ${newTagIds.length} 个新的图片标签关联`)
      await prisma.imageTag.createMany({
        data: newTagIds.map(tagId => ({
          imageId: imageId,
          tagId: tagId
        })),
        skipDuplicates: true
      })
      console.log('图片标签关联创建成功')
    } else {
      console.log('所有标签都已关联到图片，无需创建新关联')
    }

    return {
      success: true,
      tags: aiTags
    }
  } catch (error) {
    console.error('AI图片分析失败:', error)
    
    // 输出更详细的错误信息
    let errorMessage = '图片分析失败'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('错误堆栈:', error.stack)
    } else if (error && typeof error === 'object') {
      // 处理 ErrorEvent 或其他对象类型的错误
      try {
        errorMessage = JSON.stringify(error, null, 2)
        console.error('错误详情:', errorMessage)
      } catch {
        errorMessage = String(error)
      }
    } else {
      errorMessage = String(error)
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}
