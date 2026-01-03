import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchImages, SearchParams, getAllTags } from '@/lib/actions/image-actions'
import { prisma } from '@/lib/db'

/**
 * MCP/API端点：通过自然语言查询检索图片
 * 使用 DeepSeek API 将自然语言转换为结构化搜索参数
 * 
 * POST /api/ai-search
 * Body: { query: string }
 * 
 * 环境变量：
 * - DEEPSEEK_API_KEY: DeepSeek API 密钥（必需）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { success: false, error: '查询内容不能为空' },
        { status: 400 }
      )
    }

    // 检查是否有 DeepSeek API 密钥
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '未配置 DeepSeek API 密钥，请在环境变量中设置 DEEPSEEK_API_KEY' },
        { status: 500 }
      )
    }

    // 获取所有可用标签，用于帮助 AI 理解可用的标签
    const tagsResult = await getAllTags()
    const availableTags = tagsResult.success && tagsResult.data 
      ? tagsResult.data.map(t => t.name).join('、')
      : ''

    // 使用 DeepSeek API 将自然语言转换为搜索参数
    const prompt = `用户想要搜索图片，查询是："${query.trim()}"

请将用户的自然语言查询转换为结构化的搜索参数。返回一个JSON对象，包含以下可选字段：
- keyword: 关键词（标题、文件名等）
- tags: 标签名称数组（如["风景", "人物"]）
- startDate: 开始日期（ISO格式，如"2024-01-01"）
- endDate: 结束日期（ISO格式）
- camera: 相机型号
- location: 地点
- format: 图片格式（如"jpg", "png"）

${availableTags ? `可用的标签包括：${availableTags}` : ''}

只返回JSON对象，不要其他说明。如果某个字段无法从查询中推断，请省略该字段。

示例：
查询："找一些去年夏天拍摄的风景照片"
返回：{"startDate": "2023-06-01", "endDate": "2023-08-31", "tags": ["风景"]}

查询："用iPhone拍摄的照片"
返回：{"camera": "iPhone"}

查询："包含人物的jpg图片"
返回：{"tags": ["人物"], "format": "jpg"}`

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // DeepSeek 的模型名称
        messages: [
          {
            role: 'system',
            content: '你是一个图片搜索助手，将自然语言查询转换为结构化的搜索参数。只返回JSON对象，不要包含任何其他文本或说明。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `DeepSeek API 调用失败: ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = `DeepSeek API 错误: ${errorData.error?.message || errorData.message || response.statusText}`
      } catch {
        if (errorText) {
          errorMessage += ` - ${errorText.substring(0, 200)}`
        }
      }
      console.error('DeepSeek API 错误:', errorMessage)
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // 输出 DeepSeek API 的完整响应（用于调试）
    console.log('=== DeepSeek API 完整响应 ===')
    console.log(JSON.stringify(data, null, 2))
    console.log('============================')
    
    const content = data.choices?.[0]?.message?.content || '{}'
    
    // 输出提取的 content 内容
    console.log('=== DeepSeek 返回的原始内容 ===')
    console.log(content)
    console.log('==============================')

    // 解析JSON
    let searchParams: SearchParams = {}
    try {
      // 提取JSON（去除可能的markdown代码块标记）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonString = jsonMatch[0]
        console.log('=== 提取的 JSON 字符串 ===')
        console.log(jsonString)
        console.log('==========================')
        
        searchParams = JSON.parse(jsonString)
        
        console.log('=== 解析后的搜索参数 ===')
        console.log(JSON.stringify(searchParams, null, 2))
        console.log('========================')
      } else {
        throw new Error('未找到有效的JSON')
      }
    } catch (parseError) {
      console.error('解析AI返回的JSON失败:', parseError)
      console.error('AI返回的内容:', content)
      // 如果解析失败，尝试使用关键词搜索
      searchParams = { keyword: query.trim() }
    }

    // 如果有tags（标签名称），需要转换为标签ID
    if (searchParams.tags && Array.isArray(searchParams.tags) && searchParams.tags.length > 0) {
      try {
        // 查询标签名称对应的标签ID
        const tags = await prisma.tag.findMany({
          where: {
            name: { in: searchParams.tags },
            // 只查询当前用户的标签（如果有用户关联的话）
          }
        })
        
        if (tags.length > 0) {
          // 将标签名称转换为标签ID
          searchParams.tags = tags.map(t => t.id)
          console.log(`标签转换: ${searchParams.tags.length} 个标签名称转换为ID`)
        } else {
          // 如果找不到标签，将标签名称添加到关键词中
          const tagKeywords = searchParams.tags.join(' ')
          searchParams.keyword = searchParams.keyword 
            ? `${searchParams.keyword} ${tagKeywords}` 
            : tagKeywords
          delete (searchParams as any).tags
          console.log('未找到匹配的标签，将标签名称添加到关键词中')
        }
      } catch (tagError) {
        console.error('标签转换失败:', tagError)
        // 如果转换失败，将标签名称添加到关键词中
        const tagKeywords = searchParams.tags.join(' ')
        searchParams.keyword = searchParams.keyword 
          ? `${searchParams.keyword} ${tagKeywords}` 
          : tagKeywords
        delete (searchParams as any).tags
      }
    }

    // 调用现有的搜索函数
    const searchResult = await searchImages(searchParams)

    if (!searchResult.success) {
      return NextResponse.json(
        { success: false, error: searchResult.error || '搜索失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: searchResult.data || [],
      query: query.trim(),
      searchParams
    })
  } catch (error) {
    console.error('AI搜索API错误:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

// 支持GET请求（用于测试）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { success: false, error: '请提供查询参数 q' },
      { status: 400 }
    )
  }

  // 创建一个POST请求来处理
  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })

  return POST(postRequest as NextRequest)
}

