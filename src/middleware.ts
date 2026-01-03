import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 在开发环境中，支持通过查询参数清除会话
  if (process.env.NODE_ENV === 'development') {
    const clearSession = request.nextUrl.searchParams.get('clearSession') === 'true'
    
    if (clearSession) {
      // 清除所有NextAuth相关的cookie
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
      ]
      
      cookieNames.forEach(name => {
        response.cookies.delete(name)
        response.cookies.set(name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      })
      
      // 重定向到登录页（不带查询参数）
      const url = request.nextUrl.clone()
      url.searchParams.delete('clearSession')
      return NextResponse.redirect(url)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

