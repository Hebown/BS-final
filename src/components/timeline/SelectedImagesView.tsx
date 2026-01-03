'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MyImage from '@/components/MyImage'
import { Icon } from '@mdi/react'
import { mdiArrowLeft, mdiCheckCircle } from '@mdi/js'
import { Button } from '@/components/ui'
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

interface SelectedImagesViewProps {
  images: DatabaseImage[]
  isOpen: boolean
  onClose: () => void
  onImageClick?: (image: DatabaseImage) => void
  onBack?: () => void
}

export default function SelectedImagesView({
  images,
  isOpen,
  onClose,
  onImageClick
}: SelectedImagesViewProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
      onBack?.()
    }, 300)
  }

  if (!isOpen && !isExiting) return null

  return (
    <AnimatePresence>
      {(isOpen || isExiting) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-white dark:bg-immich-dark-bg"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-immich-dark-bg border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="medium"
                  onClick={handleClose}
                  className="p-2"
                >
                  <Icon path={mdiArrowLeft} size={1} />
                </Button>
                <h2 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                  已选择 {images.length} 张图片
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-[calc(100vh-73px)] overflow-y-auto p-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative group cursor-pointer"
                  onClick={() => onImageClick?.(image)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <MyImage
                      publicId={image.publicId}
                      secureUrl={image.secureUrl}
                      width={300}
                      height={300}
                      alt={image.title || '图片'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                  {image.title && (
                    <p className="mt-2 text-sm text-immich-fg dark:text-immich-dark-fg truncate">
                      {image.title}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
