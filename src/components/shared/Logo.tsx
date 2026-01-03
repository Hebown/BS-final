'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
  showBackground?: boolean
  showText?: boolean // 是否显示文本
}

/**
 * Logo 组件
 * 使用 public/chest_front.png (32x32 PNG)
 * 在桌面端显示 "chest" 文本，移动端隐藏
 */
export default function Logo({ 
  size = 40, 
  className,
  showBackground = true,
  showText = true
}: LogoProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        className
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-center shrink-0",
          showBackground && "rounded-full bg-immich-primary dark:bg-immich-dark-primary"
        )}
        style={showBackground ? { width: size, height: size } : undefined}
      >
        <Image
          src="/chest_front.png"
          alt="Logo"
          width={size}
          height={size}
          className={cn(
            "object-contain",
            !showBackground && "rounded"
          )}
          style={{
            imageRendering: 'pixelated', // 类似 GL_NEAREST，使用最近邻插值，保持像素清晰
          }}
          unoptimized // 禁用 Next.js 图片优化，保持像素图原始清晰度
          priority
        />
      </div>
      {showText && (
        <span className="hidden md:block text-xl font-semibold text-immich-fg dark:text-immich-dark-fg leading-none">
          CHEST
        </span>
      )}
    </div>
  )
}

