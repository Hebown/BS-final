'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import MyImage from './MyImage'

interface LazyImageProps {
  publicId: string
  secureUrl: string
  width: number
  height: number
  alt?: string
  className?: string
  // 占位符配置
  placeholder?: 'blur' | 'empty' | 'skeleton'
  // 提前加载的距离（像素），图片距离视口多远时开始加载
  rootMargin?: string
}

export default function LazyImage({
  publicId,
  secureUrl,
  width,
  height,
  alt = "图片",
  className = "",
  placeholder = 'empty',
  rootMargin = '200px', // 提前 200px 开始加载
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = imgRef.current
    if (!currentRef) return

    // 使用 Intersection Observer 检测元素是否进入视口
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            // 一旦进入视口，就不再需要观察了
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin, // 提前加载的距离
        threshold: 0.01, // 只要 1% 可见就触发
      }
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [rootMargin])

  // 占位符样式
  const placeholderStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div
      ref={imgRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}
    >
      {isInView ? (
        <MyImage
          publicId={publicId}
          secureUrl={secureUrl}
          width={width}
          height={height}
          alt={alt}
          className="w-full h-full"
          loading="lazy"
        />
      ) : (
        // 占位符：在图片未进入视口时显示
        <div
          className={cn(
            "w-full h-full",
            placeholder === 'skeleton' 
              ? "bg-gray-200 dark:bg-gray-700 animate-pulse" 
              : "bg-gray-100 dark:bg-gray-800"
          )}
          aria-label={alt}
          style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
        />
      )}
    </div>
  )
}

