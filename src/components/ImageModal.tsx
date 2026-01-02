// components/ImageModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@mdi/react'
import { 
  mdiClose, 
  mdiChevronLeft, 
  mdiChevronRight,
  mdiInformationOutline,
  mdiDownload,
  mdiHeartOutline,
  mdiHeart,
  mdiShareVariant,
} from '@mdi/js'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'

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

interface ImageModalProps {
  image: DatabaseImage
  images?: DatabaseImage[] // 所有图片，用于导航
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
}

export default function ImageModal({ 
  image, 
  images = [],
  onClose,
  onNext,
  onPrevious 
}: ImageModalProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const currentIndex = images.findIndex(img => img.id === image.id)

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrevious])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDownload = () => {
    if (image.secureUrl) {
      const link = document.createElement('a')
      link.href = image.secureUrl
      link.download = image.title || image.publicId.split('/').pop() || 'image'
      link.click()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 关闭按钮 - immich风格 */}
      <div className="absolute top-4 right-4 z-10">
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={onClose}
          aria-label="关闭"
          icon={<Icon path={mdiClose} size={1.2} />}
          className="bg-black/50 hover:bg-black/70 text-white"
        />
      </div>

      {/* 导航按钮 */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && onPrevious && (
            <div className="absolute left-4 z-10">
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                size="large"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrevious()
                }}
                aria-label="上一张"
                icon={<Icon path={mdiChevronLeft} size={1.5} />}
                className="bg-black/50 hover:bg-black/70 text-white"
              />
            </div>
          )}
          {currentIndex < images.length - 1 && onNext && (
            <div className="absolute right-4 z-10">
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                size="large"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                aria-label="下一张"
                icon={<Icon path={mdiChevronRight} size={1.5} />}
                className="bg-black/50 hover:bg-black/70 text-white"
              />
            </div>
          )}
        </>
      )}

      {/* 工具栏 - immich风格 */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            setIsFavorite(!isFavorite)
          }}
          aria-label={isFavorite ? "取消收藏" : "收藏"}
          icon={<Icon path={isFavorite ? mdiHeart : mdiHeartOutline} size={1.2} />}
          className="bg-black/50 hover:bg-black/70 text-white"
        />
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            handleDownload()
          }}
          aria-label="下载"
          icon={<Icon path={mdiDownload} size={1.2} />}
          className="bg-black/50 hover:bg-black/70 text-white"
        />
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
          aria-label="详情"
          icon={<Icon path={mdiInformationOutline} size={1.2} />}
          className={cn(
            "bg-black/50 hover:bg-black/70 text-white",
            showDetails && "bg-immich-primary/50"
          )}
        />
      </div>

      {/* 图片显示区域 - immich风格，全屏居中 */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {image.secureUrl ? (
          <img
            src={image.secureUrl}
            alt={image.title || `大图 ${image.publicId}`}
            className="max-w-full max-h-full object-contain"
            style={{
              maxHeight: 'calc(100vh - 8rem)'
            }}
          />
        ) : (
          <div className="text-white">图片加载失败</div>
        )}

        {/* 图片信息覆盖层 */}
        {image.title && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white text-sm font-medium">{image.title}</p>
          </div>
        )}
      </div>

      {/* 详情面板 - immich风格，右侧滑出 */}
      {showDetails && (
        <div 
          className={cn(
            "absolute right-0 top-0 h-full w-80 bg-immich-dark-gray dark:bg-immich-dark-bg",
            "border-l border-immich-dark-gray shadow-2xl",
            "overflow-y-auto immich-scrollbar",
            "animate-in slide-in-from-right duration-300"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-immich-dark-fg mb-4">
              详细信息
            </h3>

            {/* 标签 */}
            {image.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-immich-dark-fg mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((imageTag) => (
                    <span
                      key={imageTag.tag.id}
                      className="text-xs px-3 py-1 rounded-full bg-immich-primary/20 text-immich-primary dark:bg-immich-dark-primary/20 dark:text-immich-dark-primary font-medium"
                    >
                      {imageTag.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-immich-dark-fg mb-2">基本信息</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>
                    <span className="font-medium">尺寸:</span> {image.width} × {image.height}
                  </div>
                  <div>
                    <span className="font-medium">格式:</span> {image.format.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">文件大小:</span> {formatFileSize(image.bytes)}
                  </div>
                </div>
              </div>

              {image.takenAt && (
                <div>
                  <h4 className="text-sm font-medium text-immich-dark-fg mb-2">拍摄信息</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>
                      <span className="font-medium">拍摄时间:</span> {new Date(image.takenAt).toLocaleString('zh-CN')}
                    </div>
                    {image.camera && (
                      <div>
                        <span className="font-medium">相机:</span> {image.camera}
                      </div>
                    )}
                    {image.lens && (
                      <div>
                        <span className="font-medium">镜头:</span> {image.lens}
                      </div>
                    )}
                    {image.location && (
                      <div>
                        <span className="font-medium">位置:</span> {image.location}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-immich-dark-fg mb-2">其他信息</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>
                    <span className="font-medium">上传时间:</span> {new Date(image.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
