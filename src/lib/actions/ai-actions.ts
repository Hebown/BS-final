'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Hugging Face API 基础 URL
const HUGGINGFACE_API_BASE = 'https://api-inference.huggingface.co/models'

/**
 * 调用本地 AI 服务（通过 ngrok 等内网穿透工具）
 * 本地服务运行在用户的电脑上，处理 ONNX 模型推理
 */
async function callLocalAIService(
  imageUrl: string,
  candidateLabels: string[]
): Promise<Array<{ label: string; score: number }>> {
  const serviceUrl = process.env.LOCAL_AI_SERVICE_URL
  if (!serviceUrl) {
    throw new Error('未配置 LOCAL_AI_SERVICE_URL，无法使用本地 AI 服务')
  }

  console.log('使用本地 AI 服务（ngrok）:', serviceUrl)

  const response = await fetch(`${serviceUrl}/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      candidateLabels
    }),
    // 设置超时（本地服务可能需要一些时间）
    signal: AbortSignal.timeout(60000) // 60秒超时
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`本地 AI 服务调用失败: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  
  if (data.success && data.results) {
    console.log('本地 AI 服务调用成功，返回结果数量:', data.results.length)
    return data.results
  }

  throw new Error('本地 AI 服务返回格式错误')
}

/**
 * 调用 Hugging Face API（降级方案）
 */
async function callHuggingFaceZeroShotAPI(
  imageUrl: string,
  candidateLabels: string[]
): Promise<Array<{ label: string; score: number }>> {
  const apiKey = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('未配置 HF_TOKEN 或 HUGGINGFACE_API_KEY，无法使用 API 降级方案')
  }

  console.log('使用 Hugging Face API 降级方案')

  // 将图片转换为 base64
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const imageData = `data:${contentType};base64,${base64}`

  // 调用 Hugging Face Zero-Shot Image Classification API
  const apiResponse = await fetch(
    `${HUGGINGFACE_API_BASE}/openai/clip-vit-base-patch32`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imageData,
        parameters: {
          candidate_labels: candidateLabels
        },
        options: {
          wait_for_model: true
        }
      })
    }
  )

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text()
    throw new Error(`Hugging Face API 调用失败: ${apiResponse.statusText} - ${errorText}`)
  }

  const result = await apiResponse.json()
  
  // API 返回格式：{ labels: string[], scores: number[] }
  if (result.labels && result.scores) {
    return result.labels.map((label: string, index: number) => ({
      label,
      score: result.scores[index]
    }))
  }
  
  // 或者返回格式：Array<{ label: string, score: number }>
  if (Array.isArray(result)) {
    return result
  }

  throw new Error('Unexpected API response format')
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

    // 开始图片分类
    // 策略：直接使用本地 AI 服务（ngrok），如果失败则使用 Hugging Face API
    console.log('开始进行图片分类，候选标签数量:', candidateLabels.length)
    let results: any
    
    try {
      // 步骤 1: 优先使用本地 AI 服务（通过 ngrok）
      if (process.env.LOCAL_AI_SERVICE_URL) {
        console.log('调用本地 AI 服务:', process.env.LOCAL_AI_SERVICE_URL)
        results = await callLocalAIService(imageUrl, candidateLabels)
        console.log('本地 AI 服务调用成功，返回结果数量:', Array.isArray(results) ? results.length : 1)
      } else {
        throw new Error('未配置 LOCAL_AI_SERVICE_URL，尝试使用 Hugging Face API 降级方案')
      }
    } catch (localServiceError) {
      // 步骤 2: 本地服务失败，使用 Hugging Face API 降级
      console.log('本地 AI 服务不可用，使用 Hugging Face API 降级方案...')
      console.error('本地服务错误:', localServiceError instanceof Error ? localServiceError.message : String(localServiceError))
      
      try {
        results = await callHuggingFaceZeroShotAPI(imageUrl, candidateLabels)
        console.log('API 调用成功，返回结果数量:', Array.isArray(results) ? results.length : 1)
      } catch (apiError) {
        console.error('所有降级方案都失败:', apiError)
        throw new Error(
          `所有 AI 服务都不可用: 本地服务(${localServiceError instanceof Error ? localServiceError.message : String(localServiceError)}) | API(${apiError instanceof Error ? apiError.message : String(apiError)})`
        )
      }
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
