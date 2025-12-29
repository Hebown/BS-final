// components/ImageGrid.tsx
'use client'

import { useState } from 'react'
import ImageModal from './ImageModal'
import MyImage from './MyImage'

// 定义数据库图片类型
type DatabaseImage = {
  id: string
  title: string | null
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
  takenAt: Date | null
  location: string | null
  camera: string | null
  lens: string | null
  createdAt: Date
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string | null
    }
  }>
}

interface ImageGridProps {
  images: DatabaseImage[]
}

export default function ImageGrid({ images }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<DatabaseImage | null>(null)

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          还没有图片，快去上传一些吧！
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => setSelectedImage(image)}
          >
            <MyImage
              publicId={image.publicId}
              width={250}
              height={200}
              alt={image.title || `图片 ${image.publicId}`}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
            <div className="mt-2 px-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {image.title || image.publicId.split('/').pop()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {image.format.toUpperCase()} • {image.width}×{image.height}
              </p>
              {image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {image.tags.slice(0, 3).map((imageTag) => (
                    <span
                      key={imageTag.tag.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {imageTag.tag.name}
                    </span>
                  ))}
                  {image.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{image.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}