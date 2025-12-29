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
}

export default function MyImage({ 
  publicId,
  width = 300,
  height = 200,
  alt = "图片",
  className = "",
  transformations = {}
}: MyImageProps) {
  return (
    <CldImage
      src={publicId}
      width={width}
      height={height}
      alt={alt}
      className={`rounded-lg shadow-md transition-all duration-300 ${className}`}
      crop={transformations.crop}
      gravity={transformations.gravity}
      effects={transformations.effects}
      quality={transformations.quality}
    />
  )
}