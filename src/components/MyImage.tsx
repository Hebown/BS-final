// components/MyImage.tsx
'use client'

import { useState, useEffect } from 'react'
import { CldImage, CldImageProps } from 'next-cloudinary'

interface MyImageProps {
  publicId: string
  secureUrl?: string // 如果提供了 secureUrl，直接使用它
  width?: number
  height?: number
  alt?: string
  className?: string
  transformations?: Pick<CldImageProps, 
    'crop' | 'gravity' | 'effects' | 'quality' | 
    'blur' | 'brightness' | 'contrast' | 'saturation'
  >
  loading?: 'lazy' | 'eager'
}

export default function MyImage({ 
  publicId,
  secureUrl,
  width = 300,
  height = 200,
  alt = "图片",
  className = "",
  transformations = {},
  loading = 'lazy'
}: MyImageProps) {
  const [imageError, setImageError] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  // 如果提供了 secureUrl，使用 Cloudinary 的优化 URL（添加转换参数以加快加载）
  useEffect(() => {
    if (!secureUrl) return

    // 对于时间线缩略图，使用较小的尺寸和质量以加快加载
    const isThumbnail = width <= 300 && height <= 300
    
    // 构建优化后的 URL
    let optimizedUrl = secureUrl
    
    // 如果是缩略图，添加 Cloudinary 转换参数
    if (isThumbnail && secureUrl.includes('res.cloudinary.com')) {
      try {
        // Cloudinary URL 格式: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{version}/{public_id}.{format}
        // 我们需要在 /upload/ 后面插入转换参数
        const uploadIndex = secureUrl.indexOf('/upload/')
        if (uploadIndex !== -1) {
          const beforeUpload = secureUrl.substring(0, uploadIndex + 8) // 包含 '/upload/'
          const afterUpload = secureUrl.substring(uploadIndex + 8)
          
          // 检查是否已经有转换参数（避免重复添加）
          if (afterUpload.includes('/v') || afterUpload.startsWith('v')) {
            // 构建转换参数：w_宽度,h_高度,c_fill,q_auto:good,f_auto
            // 使用实际需要的尺寸，而不是固定的 maxSize
            const targetWidth = Math.ceil(width)
            const targetHeight = Math.ceil(height)
            const transform = `w_${targetWidth},h_${targetHeight},c_fill,q_auto:good,f_auto/`
            optimizedUrl = `${beforeUpload}${transform}${afterUpload}`
          } else {
            // 如果 URL 格式不正确，使用原始 URL
            optimizedUrl = secureUrl
          }
        }
      } catch (e) {
        // 如果 URL 解析失败，使用原始 URL
        console.warn('Failed to optimize image URL:', e)
        optimizedUrl = secureUrl
      }
    }
    
    setCurrentUrl(optimizedUrl)
    setImageError(false)
  }, [secureUrl, width, height])

  const handleError = () => {
    // 如果优化后的 URL 失败，尝试使用原始 URL
    if (currentUrl !== secureUrl && secureUrl) {
      setCurrentUrl(secureUrl)
      setImageError(false)
    } else {
      setImageError(true)
    }
  }

  if (secureUrl && currentUrl) {
    return (
      <img
        src={currentUrl}
        width={width}
        height={height}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={handleError}
        onLoad={() => setImageError(false)}
      />
    )
  }

  // 否则使用 CldImage 组件（需要配置 next-cloudinary）
  return (
    <CldImage
      src={publicId}
      width={width}
      height={height}
      alt={alt}
      className={className}
      crop={transformations.crop || 'fill'}
      gravity={transformations.gravity || 'auto'}
      effects={transformations.effects}
      quality={transformations.quality || 'auto'}
      loading={loading}
    />
  )
}
