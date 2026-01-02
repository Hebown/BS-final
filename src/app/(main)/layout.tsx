'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import UserPageLayout from '@/components/layouts/UserPageLayout'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // 记录当前路由，用于搜索页面的返回功能
  useEffect(() => {
    if (pathname && pathname !== '/search') {
      sessionStorage.setItem('previousRoute', pathname)
    }
  }, [pathname])

  if (status === 'loading') {
    return (
      <UserPageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">加载中...</div>
        </div>
      </UserPageLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null // 重定向到登录页
  }

  // 搜索页面不使用 UserPageLayout（因为它有自己的 ControlAppBar）
  if (pathname === '/search') {
    return <>{children}</>
  }

  return (
    <UserPageLayout showUploadButton>
      {children}
    </UserPageLayout>
  )
}

