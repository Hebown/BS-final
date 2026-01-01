// components/MyImage.tsx
import { CldImage,CldImageProps } from 'next-cloudinary'

interface MyImageProps {
  publicId: string
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
  width = 300,
  height = 200,
  alt = "图片",
  className = "",
  transformations = {},
  loading = 'lazy'
}: MyImageProps) {
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