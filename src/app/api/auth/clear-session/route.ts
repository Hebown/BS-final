import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * 清除会话的API端点
 * 仅在开发环境中可用
 */
export async function POST() {
  // 只在开发环境中允许清除会话
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '此功能仅在开发环境中可用' },
      { status: 403 }
    )
  }

  const cookieStore = await cookies()
  
  // 清除所有NextAuth相关的cookie
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
  ]

  cookieNames.forEach(name => {
    cookieStore.delete(name)
  })

  return NextResponse.json({ 
    success: true, 
    message: '会话已清除',
    cleared: cookieNames 
  })
}


