import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchImages, SearchParams } from '@/lib/actions/image-actions'

/**
 * MCP/API端点：通过自然语言查询检索图片
 * POST /api/ai-search
 * Body: { query: string }
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

    // 检查是否有API密钥
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '未配置OpenAI API密钥' },
        { status: 500 }
      )
    }

    // 使用OpenAI将自然语言转换为搜索参数
    const prompt = `用户想要搜索图片，查询是："${query.trim()}"

请将用户的自然语言查询转换为结构化的搜索参数。返回一个JSON对象，包含以下可选字段：
- keyword: 关键词（标题、文件名等）
- tags: 标签名称数组（如["风景", "人物"]）
- startDate: 开始日期（ISO格式，如"2024-01-01"）
- endDate: 结束日期（ISO格式）
- camera: 相机型号
- location: 地点
- format: 图片格式（如"jpg", "png"）

只返回JSON对象，不要其他说明。如果某个字段无法从查询中推断，请省略该字段。

示例：
查询："找一些去年夏天拍摄的风景照片"
返回：{"startDate": "2023-06-01", "endDate": "2023-08-31", "tags": ["风景"]}

查询："用iPhone拍摄的照片"
返回：{"camera": "iPhone"}

查询："包含人物的jpg图片"
返回：{"tags": ["人物"], "format": "jpg"}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个图片搜索助手，将自然语言查询转换为结构化的搜索参数。只返回JSON对象。'
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
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: `AI查询解析失败: ${errorData.error?.message || response.statusText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    // 解析JSON
    let searchParams: SearchParams = {}
    try {
      // 提取JSON（去除可能的markdown代码块标记）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        searchParams = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('解析AI返回的JSON失败:', parseError, content)
      // 如果解析失败，尝试使用关键词搜索
      searchParams = { keyword: query.trim() }
    }

    // 如果有tags（标签名称），需要转换为标签ID
    // 这里简化处理：如果提供了tags数组，我们将在searchImages中使用关键词搜索
    // 因为searchImages的tags参数需要标签ID，而我们只有标签名称
    // 为了简化，我们将标签名称也添加到keyword中
    if (searchParams.tags && Array.isArray(searchParams.tags)) {
      const tagKeywords = searchParams.tags.join(' ')
      searchParams.keyword = searchParams.keyword 
        ? `${searchParams.keyword} ${tagKeywords}` 
        : tagKeywords
      delete (searchParams as any).tags // 暂时移除tags，因为需要ID
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

