'use client'

import { useSession } from 'next-auth/react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()

  // 如果已认证，显示加载状态（Server Action 的 redirect 会立即生效）
  // 重定向完全由 Server Action 的 redirect() 处理，不在这里进行客户端重定向
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-immich-bg dark:bg-immich-dark-bg">
        <div className="text-center">
          <p className="text-immich-fg dark:text-immich-dark-fg">正在跳转...</p>
        </div>
      </div>
    )
  }

  // 未认证时正常渲染子组件
  return <>{children}</>
}
