/**
 * Hugging Face API 工具函数
 * 用于调用 Hugging Face Inference API 进行图片分析
 */

// Hugging Face Inference API 端点
// 使用传统的 Inference API（免费，无需特殊权限）
// 虽然官方建议使用 router，但传统 API 仍然可用且免费
const HUGGINGFACE_API_BASE = 'https://api-inference.huggingface.co/models'

/**
 * 获取 Hugging Face API Key
 */
function getApiKey(): string | null {
  return process.env.HUGGINGFACE_API_KEY || null
}

/**
 * 将图片 URL 转换为 base64 编码
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw error
  }
}

/**
 * 调用 Hugging Face Inference API
 */
async function callHuggingFaceAPI(
  model: string,
  inputs: string | { image: string } | { inputs: string },
  options?: {
    wait_for_model?: boolean
    use_cache?: boolean
  }
): Promise<any> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('未配置Hugging Face API密钥，请在环境变量中设置HUGGINGFACE_API_KEY')
  }

  const url = `${HUGGINGFACE_API_BASE}/${model}`
  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  // Router API 格式：{ inputs: <data>, wait_for_model: true, ... }
  // inputs 可以是字符串（base64 或 data URI）或对象
  const body: any = { 
    inputs: inputs 
  }
  
  // 添加选项参数
  if (options) {
    if (options.wait_for_model !== undefined) {
      body.wait_for_model = options.wait_for_model
    }
    if (options.use_cache !== undefined) {
      body.use_cache = options.use_cache
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Hugging Face API调用失败: ${response.statusText}`
    
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error) {
        errorMessage = `Hugging Face API错误: ${errorData.error}`
      }
    } catch {
      // 如果解析失败，使用原始错误文本
      if (errorText) {
        errorMessage += ` - ${errorText}`
      }
    }

    throw new Error(errorMessage)
  }

  return await response.json()
}

/**
 * 图片分类 - 识别图片中的主要对象和场景
 */
export async function classifyImage(
  imageUrl: string,
  model?: string
): Promise<{
  success: boolean
  labels?: Array<{ label: string; score: number }>
  error?: string
}> {
  try {
    const classificationModel = model || 
      process.env.HUGGINGFACE_IMAGE_CLASSIFICATION_MODEL || 
      'google/vit-base-patch16-224'

    // 将图片转换为 base64
    const imageBase64 = await imageUrlToBase64(imageUrl)
    
    // Router API 接受直接 base64 字符串或 data URI
    // 尝试两种格式以确保兼容性
    const imageData = `data:image/jpeg;base64,${imageBase64}`

    // 调用 API - Router API 使用 { inputs: <data> } 格式
    const result = await callHuggingFaceAPI(
      classificationModel,
      imageData, // 直接传递 data URI 字符串
      { wait_for_model: true }
    )

    // 处理结果 - 可能是数组或单个对象
    const labels = Array.isArray(result) ? result : [result]
    
    // 按置信度排序，取前10个
    const sortedLabels = labels
      .filter((item: any) => item.label && item.score)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((item: any) => ({
        label: item.label,
        score: item.score
      }))

    return {
      success: true,
      labels: sortedLabels
    }
  } catch (error) {
    console.error('Hugging Face图片分类失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片分类失败'
    }
  }
}

/**
 * 图片描述生成 - 生成图片的自然语言描述
 */
export async function generateImageCaption(
  imageUrl: string,
  model?: string
): Promise<{
  success: boolean
  caption?: string
  error?: string
}> {
  try {
    const captionModel = model || 
      process.env.HUGGINGFACE_IMAGE_TO_TEXT_MODEL || 
      'Salesforce/blip-image-captioning-base'

    // 将图片转换为 base64
    const imageBase64 = await imageUrlToBase64(imageUrl)
    const imageData = `data:image/jpeg;base64,${imageBase64}`

    // 调用 API
    const result = await callHuggingFaceAPI(
      captionModel,
      { image: imageData },
      { wait_for_model: true }
    )

    // 处理结果
    let caption = ''
    if (Array.isArray(result) && result.length > 0) {
      caption = result[0].generated_text || result[0].caption || ''
    } else if (typeof result === 'object' && result.generated_text) {
      caption = result.generated_text
    } else if (typeof result === 'string') {
      caption = result
    }

    if (!caption) {
      throw new Error('未能生成图片描述')
    }

    return {
      success: true,
      caption: caption.trim()
    }
  } catch (error) {
    console.error('Hugging Face图片描述生成失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片描述生成失败'
    }
  }
}

/**
 * 对象检测 - 检测图片中的多个对象及其位置
 */
export async function detectObjects(
  imageUrl: string,
  model?: string
): Promise<{
  success: boolean
  objects?: Array<{
    label: string
    score: number
    box: { xmin: number; ymin: number; xmax: number; ymax: number }
  }>
  error?: string
}> {
  try {
    const detectionModel = model || 
      process.env.HUGGINGFACE_OBJECT_DETECTION_MODEL || 
      'facebook/detr-resnet-50'

    // 将图片转换为 base64
    const imageBase64 = await imageUrlToBase64(imageUrl)
    const imageData = `data:image/jpeg;base64,${imageBase64}`

    // 调用 API
    const result = await callHuggingFaceAPI(
      detectionModel,
      { image: imageData },
      { wait_for_model: true }
    )

    // 处理结果
    const objects = Array.isArray(result) ? result : [result]
    const detectedObjects = objects
      .filter((item: any) => item.label && item.score)
      .map((item: any) => ({
        label: item.label,
        score: item.score,
        box: item.box || {
          xmin: item.xmin || 0,
          ymin: item.ymin || 0,
          xmax: item.xmax || 0,
          ymax: item.ymax || 0
        }
      }))

    return {
      success: true,
      objects: detectedObjects
    }
  } catch (error) {
    console.error('Hugging Face对象检测失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '对象检测失败'
    }
  }
}

/**
 * 从分类结果中提取中文标签
 * 将英文标签映射为中文，或使用描述生成来获取中文标签
 */
export function extractChineseTagsFromLabels(
  labels: Array<{ label: string; score: number }>,
  minScore: number = 0.3
): string[] {
  // 常见的英文到中文标签映射
  const labelMap: Record<string, string> = {
    // 场景
    'landscape': '风景',
    'outdoor': '户外',
    'indoor': '室内',
    'city': '城市',
    'nature': '自然',
    'beach': '海滩',
    'mountain': '山',
    'forest': '森林',
    'park': '公园',
    'street': '街道',
    'building': '建筑',
    
    // 对象
    'person': '人物',
    'people': '人物',
    'human': '人物',
    'animal': '动物',
    'dog': '狗',
    'cat': '猫',
    'bird': '鸟',
    'car': '车辆',
    'vehicle': '车辆',
    'bicycle': '自行车',
    'food': '食物',
    'fruit': '水果',
    'flower': '花',
    'tree': '树',
    
    // 时间
    'day': '白天',
    'night': '夜晚',
    'sunset': '日落',
    'sunrise': '日出',
    
    // 其他
    'portrait': '肖像',
    'selfie': '自拍',
    'group': '群体',
    'sport': '运动',
    'travel': '旅行',
    'wedding': '婚礼',
    'party': '聚会'
  }

  const tags: string[] = []
  
  for (const { label, score } of labels) {
    if (score < minScore) continue
    
    // 尝试直接映射
    const lowerLabel = label.toLowerCase()
    if (labelMap[lowerLabel]) {
      tags.push(labelMap[lowerLabel])
    } else {
      // 如果找不到映射，尝试部分匹配
      const matched = Object.keys(labelMap).find(key => 
        lowerLabel.includes(key) || key.includes(lowerLabel)
      )
      if (matched) {
        tags.push(labelMap[matched])
      } else {
        // 如果都没有匹配，使用原始标签（可能是中文）
        tags.push(label)
      }
    }
  }

  // 去重并限制数量
  return Array.from(new Set(tags)).slice(0, 10)
}

