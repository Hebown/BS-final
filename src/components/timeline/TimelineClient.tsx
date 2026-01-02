'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TimelineView from './TimelineView'
import ImageModal from '@/components/ImageModal'

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

interface TimelineClientProps {
  images: DatabaseImage[]
}

export default function TimelineClient({ images: initialImages }: TimelineClientProps) {
  const [selectedImage, setSelectedImage] = useState<DatabaseImage | null>(null)
  const [images, setImages] = useState(initialImages)
  const router = useRouter()

  // 监听数据刷新事件（使用桥接层）
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent<{ paths: string[] }>) => {
      // 如果刷新路径包含当前路径，则刷新路由
      if (event.detail.paths.includes('/dashboard')) {
        router.refresh()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [router])

  // 将字符串日期转换为 Date 对象
  const processedImages = images.map(img => ({
    ...img,
    takenAt: img.takenAt ? new Date(img.takenAt) : null,
    createdAt: new Date(img.createdAt),
  }))

  // 导航函数
  const currentIndex = selectedImage 
    ? processedImages.findIndex(img => img.id === selectedImage.id)
    : -1

  const handleNext = () => {
    if (currentIndex < processedImages.length - 1) {
      setSelectedImage(processedImages[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(processedImages[currentIndex - 1])
    }
  }

  return (
    <>
      <TimelineView
        images={processedImages}
        onImageClick={setSelectedImage}
      />
      
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          images={processedImages}
          onClose={() => setSelectedImage(null)}
          onNext={currentIndex < processedImages.length - 1 ? handleNext : undefined}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
        />
      )}
    </>
  )
}

