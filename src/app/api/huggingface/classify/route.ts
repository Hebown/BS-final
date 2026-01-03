import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { classifyImage } from '@/lib/huggingface'

/**
 * Hugging Face 图片分类 API
 * POST /api/huggingface/classify
 * Body: { imageUrl: string, model?: string }
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
    const { imageUrl, model } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: '请提供有效的图片URL' },
        { status: 400 }
      )
    }

    const result = await classifyImage(imageUrl, model)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '图片分类失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      labels: result.labels
    })
  } catch (error) {
    console.error('Hugging Face分类API错误:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

