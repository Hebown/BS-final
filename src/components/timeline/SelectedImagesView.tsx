'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MyImage from '@/components/MyImage'
import { Icon } from '@mdi/react'
import { mdiArrowLeft, mdiCheckCircle, mdiDelete } from '@mdi/js'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { deleteImages } from '@/lib/actions/image-actions'

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
  onDelete?: () => void // 删除后的回调，用于刷新数据
}

export default function SelectedImagesView({
  images,
  isOpen,
  onClose,
  onImageClick,
  onDelete
}: SelectedImagesViewProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleDelete = async () => {
    if (images.length === 0) return
    
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      const imageIds = images.map(img => img.id)
      const result = await deleteImages(imageIds)
      
      if (result.success) {
        // 刷新页面数据
        router.refresh()
        // 调用删除回调
        onDelete?.()
        // 关闭视图
        handleClose()
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
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
                  disabled={isDeleting}
                >
                  <Icon path={mdiArrowLeft} size={1} />
                </Button>
                <h2 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                  已选择 {images.length} 张图片
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="filled"
                  color="danger"
                  size="medium"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting || images.length === 0}
                  className="flex items-center gap-2"
                >
                  <Icon path={mdiDelete} size={1} />
                  {isDeleting ? '删除中...' : '删除'}
                </Button>
              </div>
            </div>
          </div>

          {/* 删除确认对话框 */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-immich-dark-bg rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
                  确认删除
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  确定要删除选中的 {images.length} 张图片吗？此操作无法撤销。
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    取消
                  </Button>
                  <Button
                    variant="filled"
                    color="danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '删除中...' : '确认删除'}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
