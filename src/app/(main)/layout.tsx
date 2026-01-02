'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import UserPageLayout from '@/components/layouts/UserPageLayout'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

  return (
    <UserPageLayout showUploadButton>
      {children}
    </UserPageLayout>
  )
}

