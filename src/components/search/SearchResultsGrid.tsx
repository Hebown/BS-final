'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import MyImage from '@/components/MyImage'
import { getJustifiedLayoutFromAssets, type CommonPosition } from '@/lib/utils/layout-utils'
import { Icon } from '@mdi/react'
import { mdiCheckCircle, mdiCheckCircleOutline } from '@mdi/js'

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

interface SearchResultsGridProps {
  images: DatabaseImage[]
  onImageClick?: (image: DatabaseImage) => void
  isSelectionMode?: boolean
  selectedImageIds?: Set<string>
  onImageSelect?: (image: DatabaseImage, selected: boolean) => void
}

export default function SearchResultsGrid({ 
  images, 
  onImageClick,
  isSelectionMode = false,
  selectedImageIds = new Set(),
  onImageSelect,
}: SearchResultsGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const rowHeight = 235
  const spacing = 4

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const layout = useMemo(() => {
    if (images.length === 0) return null

    return getJustifiedLayoutFromAssets(
      images.map(img => ({
        width: img.width,
        height: img.height,
      })),
      {
        rowHeight,
        rowWidth: containerWidth - 80, // 减去滚动条和边距
        spacing,
        heightTolerance: 0.25,
      }
    )
  }, [images, containerWidth])

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          没有找到匹配的图片
        </p>
      </div>
    )
  }

  if (!layout) {
    return null
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex">
      <div
        ref={scrollableRef}
        className="flex-1 overflow-y-auto immich-scrollbar px-4"
      >
        <div 
          className="relative"
          style={{ 
            height: `${layout.containerHeight}px`,
            width: `${layout.containerWidth}px`
          }}
        >
          {images.map((image, index) => {
            const position = layout.getPosition(index)
            
            return (
              <div
                key={image.id}
                className={cn(
                  "absolute group cursor-pointer",
                  "transition-transform duration-150 ease-out",
                  "hover:z-10",
                  isSelectionMode && selectedImageIds.has(image.id) && "ring-2 ring-immich-primary ring-offset-2"
                )}
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${position.width}px`,
                  height: `${position.height}px`,
                }}
                onClick={() => {
                  if (isSelectionMode) {
                    onImageSelect?.(image, !selectedImageIds.has(image.id))
                  } else {
                    onImageClick?.(image)
                  }
                }}
              >
                <MyImage
                  publicId={image.publicId}
                  secureUrl={image.secureUrl}
                  width={position.width}
                  height={position.height}
                  alt={image.title || `图片 ${image.publicId}`}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                
                {/* 选择模式下的选中标记 */}
                {isSelectionMode && (
                  <div className="absolute top-2 right-2">
                    <Icon
                      path={selectedImageIds.has(image.id) ? mdiCheckCircle : mdiCheckCircleOutline}
                      size={1.5}
                      className={cn(
                        "transition-colors",
                        selectedImageIds.has(image.id)
                          ? "text-immich-primary"
                          : "text-white/80"
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

