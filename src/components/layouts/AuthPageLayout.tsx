'use client'

import { ReactNode } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthPageLayoutProps {
  title?: string
  children: ReactNode
  withHeader?: boolean
}

export default function AuthPageLayout({ 
  title, 
  children, 
  withHeader = true 
}: AuthPageLayoutProps) {
  return (
    <section className="w-screen min-h-screen flex items-center justify-center relative bg-immich-bg dark:bg-immich-dark-bg overflow-x-hidden">
      {/* 背景装饰层 - 类似immich的设计 */}
      <div className="absolute -z-10 w-full h-full flex place-items-center place-content-center">
        {/* Logo背景装饰 - 这里可以替换为实际的logo图片 */}
        <div className="max-w-md mx-auto h-full mb-2 antialiased overflow-hidden opacity-10">
          <div className="w-64 h-64 rounded-full bg-immich-primary dark:bg-immich-dark-primary blur-3xl"></div>
        </div>
        {/* 模糊遮罩层 */}
        <div 
          className="w-full h-[99%] absolute start-0 top-0 backdrop-blur-[200px] bg-transparent dark:bg-immich-dark-bg/20"
        ></div>
      </div>

      {/* 主卡片容器 - 使用immich的Card组件 */}
      <Card color="secondary" shape="round" border className="w-full max-w-lg m-2">
        {withHeader && (
          <CardHeader className="mt-6">
            <div className="flex flex-col items-center gap-4">
              {/* Logo图标 */}
              <div className="w-16 h-16 rounded-full bg-immich-primary dark:bg-immich-dark-primary flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {title && (
                <h1 className={cn(
                  "text-2xl font-semibold",
                  "text-immich-fg dark:text-immich-dark-fg"
                )}>
                  {title}
                </h1>
              )}
            </div>
          </CardHeader>
        )}

        <CardBody className="p-8">
          {children}
        </CardBody>
      </Card>
    </section>
  )
}
