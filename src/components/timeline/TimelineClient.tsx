'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TimelineView from './TimelineView'
import ImageModal from '@/components/ImageModal'
import SelectedImagesView from './SelectedImagesView'

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
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())
  const [showSelectedView, setShowSelectedView] = useState(false)
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

  const handleImageSelect = (image: DatabaseImage, selected: boolean) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(image.id)
      } else {
        newSet.delete(image.id)
      }
      return newSet
    })
  }

  const handleShowSelected = (selectedImages: DatabaseImage[]) => {
    setShowSelectedView(true)
  }

  const handleBackFromSelected = () => {
    setShowSelectedView(false)
  }

  // 切换选择模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 Escape 退出选择模式
      if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false)
        setSelectedImageIds(new Set())
      }
      // 按 Ctrl/Cmd + A 进入选择模式
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isSelectionMode) {
        e.preventDefault()
        setIsSelectionMode(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionMode])

  if (showSelectedView) {
    const selectedImages = processedImages.filter(img => selectedImageIds.has(img.id))
    return (
      <SelectedImagesView
        images={selectedImages}
        isOpen={showSelectedView}
        onClose={handleBackFromSelected}
        onImageClick={(image) => {
          setSelectedImage(image)
          setShowSelectedView(false)
        }}
      />
    )
  }

  return (
    <>
      {/* Selection Mode Toggle Button - 只在非选择视图时显示 */}
      {!showSelectedView && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              if (isSelectionMode) {
                setSelectedImageIds(new Set())
              }
            }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg",
              isSelectionMode
                ? "bg-immich-primary text-white hover:bg-immich-primary/90"
                : "bg-white dark:bg-immich-dark-gray text-immich-fg dark:text-immich-dark-fg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {isSelectionMode ? '取消选择' : '选择图片'}
          </button>
        </div>
      )}

      <TimelineView
        images={processedImages}
        onImageClick={isSelectionMode ? undefined : setSelectedImage}
        isSelectionMode={isSelectionMode}
        selectedImageIds={selectedImageIds}
        onImageSelect={handleImageSelect}
        onShowSelected={handleShowSelected}
      />
      
      {selectedImage && !isSelectionMode && (
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

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

