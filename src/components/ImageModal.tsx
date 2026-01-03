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
  mdiPencil,
  mdiImageEditOutline,
  mdiDelete,
} from '@mdi/js'
import { IconButton } from '@/components/ui/icon-button'
import { Button, Input, Field, Modal, ModalBody, ModalFooter, HStack } from '@/components/ui'
import { cn } from '@/lib/utils'
import { updateImage, saveEditedImageAsNew, deleteImage, EditParams } from '@/lib/actions/image-actions'
import { useRouter } from 'next/navigation'
import ImageEditor from './ImageEditor'
import { CldImage } from 'next-cloudinary'
import ImageTagEditor from './tags/ImageTagEditor'

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
  const [isEditing, setIsEditing] = useState(false) // 编辑元数据
  const [isImageEditing, setIsImageEditing] = useState(false) // 编辑图片
  const [editTitle, setEditTitle] = useState(image.title || '')
  const [editTakenAt, setEditTakenAt] = useState(
    image.takenAt ? new Date(image.takenAt).toISOString().slice(0, 16) : ''
  )
  const router = useRouter()
  const currentIndex = images.findIndex(img => img.id === image.id)
  
  const [updateState, setUpdateState] = useState<{ success: boolean; message?: string; error?: string }>({ success: false })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateState({ success: false })
    
    try {
      const formData = new FormData(e.currentTarget)
      const takenAt = formData.get('takenAt') as string
      const result = await updateImage(image.id, {
        title: formData.get('title') as string || null,
        takenAt: takenAt ? new Date(takenAt) : null,
      })
      
      setUpdateState(result)
      
      if (result.success) {
        setIsEditing(false)
        // 延迟刷新，让用户看到成功消息
        setTimeout(() => {
          router.refresh() // 刷新页面以更新时间轴
        }, 500)
      }
    } catch (error) {
      setUpdateState({
        success: false,
        error: error instanceof Error ? error.message : '保存失败'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // 当图片变化时更新编辑表单
  useEffect(() => {
    setEditTitle(image.title || '')
    setEditTakenAt(image.takenAt ? new Date(image.takenAt).toISOString().slice(0, 16) : '')
  }, [image])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteImage(image.id)
      if (result.success) {
        // 删除成功后，如果有下一张则导航到下一张，否则导航到上一张
        if (currentIndex < images.length - 1 && onNext) {
          onNext()
        } else if (currentIndex > 0 && onPrevious) {
          onPrevious()
        } else {
          // 如果这是最后一张，关闭模态框
          onClose()
        }
        setShowDeleteConfirm(false)
        // 刷新页面以更新图片列表
        router.refresh()
      } else {
        setUpdateState({
          success: false,
          error: result.error || '删除失败'
        })
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      setUpdateState({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      })
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* 删除确认模态框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60">
          <Modal
            size="small"
            title="删除图片"
            icon={mdiDelete}
            onClose={() => setShowDeleteConfirm(false)}
          >
          <ModalBody>
            <p className="text-immich-fg dark:text-immich-dark-fg">
              确定要删除这张图片吗？此操作无法撤销。
            </p>
            {updateState.error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {updateState.error}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack fullWidth>
              <Button
                color="secondary"
                fullWidth
                shape="round"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </Button>
              <Button
                color="danger"
                fullWidth
                shape="round"
                onClick={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
              >
                删除
              </Button>
            </HStack>
          </ModalFooter>
        </Modal>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
      {/* 关闭按钮 */}
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

      {/* 工具栏 */}
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
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(!isEditing)
            setIsImageEditing(false) // 关闭图片编辑
          }}
          aria-label="编辑信息"
          icon={<Icon path={mdiPencil} size={1.2} />}
          className={cn(
            "bg-black/50 hover:bg-black/70 text-white",
            isEditing && "bg-immich-primary/50"
          )}
        />
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            setIsImageEditing(!isImageEditing)
            setIsEditing(false) // 关闭元数据编辑
          }}
          aria-label="编辑图片"
          icon={<Icon path={mdiImageEditOutline} size={1.2} />}
          className={cn(
            "bg-black/50 hover:bg-black/70 text-white",
            isImageEditing && "bg-immich-primary/50"
          )}
        />
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          size="medium"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteConfirm(true)
          }}
          aria-label="删除"
          icon={<Icon path={mdiDelete} size={1.2} />}
          className="bg-black/50 hover:bg-red-500/50 text-white"
        />
      </div>

      {/* 图片显示区域 */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {image.secureUrl ? (
          isImageEditing ? (
            // 编辑模式：显示编辑器
            <div className="w-full h-full max-w-7xl max-h-[calc(100vh-8rem)]">
              <ImageEditor
                publicId={image.publicId}
                secureUrl={image.secureUrl}
                onSave={async (editParams, imageData, overwrite) => {
                  const result = await saveEditedImageAsNew(image.id, editParams, imageData, overwrite)
                  if (result.success) {
                    // 保存成功后刷新页面
                    router.refresh()
                  }
                  return result
                }}
                onCancel={() => {
                  setIsImageEditing(false)
                }}
              />
            </div>
          ) : (
            // 正常模式：显示图片
            <img
              src={image.secureUrl}
              alt={image.title || `大图 ${image.publicId}`}
              className="max-w-full max-h-full object-contain"
              style={{
                maxHeight: 'calc(100vh - 8rem)'
              }}
            />
          )
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

      {/* 详情面板 */}
      {(showDetails || isEditing) && !isImageEditing && (
        <div 
          className={cn(
            "absolute right-0 top-0 h-full w-80 bg-white dark:bg-immich-dark-bg",
            "border-l border-gray-200 dark:border-immich-dark-gray shadow-2xl",
            "overflow-y-auto immich-scrollbar",
            "animate-in slide-in-from-right duration-300"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                {isEditing ? '编辑信息' : '详细信息'}
              </h3>
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                size="small"
                onClick={() => {
                  setIsEditing(false)
                  setShowDetails(false)
                }}
                icon={<Icon path={mdiClose} size={1} />}
              />
            </div>

            {/* 编辑表单 */}
            {isEditing && (
              <form 
                onSubmit={handleSaveEdit}
                className="space-y-4"
              >
                <Field label="标题">
                  <Input
                    name="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="图片标题"
                  />
                </Field>
                
                <Field label="拍摄时间（用于时间轴分组）">
                  <Input
                    name="takenAt"
                    type="datetime-local"
                    value={editTakenAt}
                    onChange={(e) => setEditTakenAt(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    修改拍摄时间后，图片会在时间轴中重新分组
                  </p>
                </Field>

                {updateState.error && (
                  <div className="text-sm text-danger-500">{updateState.error}</div>
                )}

                {updateState.success && (
                  <div className="text-sm text-success-500">{updateState.message}</div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="medium"
                    loading={isUpdating}
                    className="flex-1"
                  >
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="medium"
                    onClick={() => setIsEditing(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            )}

            {/* 标签编辑 */}
            <ImageTagEditor
              imageId={image.id}
              currentTags={image.tags.map(it => ({
                id: it.tag.id,
                name: it.tag.name,
                color: it.tag.color
              }))}
              onUpdate={() => {
                router.refresh()
              }}
            />

            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm uppercase immich-form-label mb-2">基本信息</h4>
                <div className="space-y-2 text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
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
                  <h4 className="text-sm uppercase immich-form-label mb-2">拍摄信息</h4>
                  <div className="space-y-2 text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
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
                <h4 className="text-sm uppercase immich-form-label mb-2">其他信息</h4>
                <div className="space-y-2 text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
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
    </>
  )
}
