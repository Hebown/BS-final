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

interface ImageGalleryProps {
  images: DatabaseImage[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<DatabaseImage | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'year' | 'month'>('all')

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          还没有图片，快去上传一些吧！
        </p>
      </div>
    )
  }

  // 苹果风格的密集网格布局
  return (
    <>
      <div className="px-2 py-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-0.5">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <MyImage
                publicId={image.publicId}
                width={250}
                height={250}
                alt={image.title || `图片 ${image.publicId}`}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                transformations={{
                  crop: 'fill',
                  gravity: 'auto',
                  quality: 'auto:good',
                }}
                loading="lazy"
              />
              {/* 悬停时的叠加层 - Apple style */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* 底部过滤选项 - Apple style */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="glass-effect rounded-full px-4 py-2 flex items-center gap-4 shadow-lg border border-gray-200/60">
          <button
            onClick={() => setViewMode('year')}
            className={`text-sm px-3 py-1 rounded-full transition-all duration-200 font-medium ${
              viewMode === 'year'
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            年
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`text-sm px-3 py-1 rounded-full transition-all duration-200 font-medium ${
              viewMode === 'month'
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`text-sm px-3 py-1 rounded-full transition-all duration-200 font-medium ${
              viewMode === 'all'
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          <button className="text-gray-500 hover:text-gray-700 transition-colors ml-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
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

