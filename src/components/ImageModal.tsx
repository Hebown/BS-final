// components/ImageModal.tsx
'use client'

import { CldImage } from 'next-cloudinary'

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
  onClose: () => void
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-full overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {image.title || image.publicId.split('/').pop()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <CldImage
            src={image.publicId}
            width={800}
            height={600}
            alt={image.title || `大图 ${image.publicId}`}
            className="rounded-lg w-full h-auto"
          />
          
          <div className="mt-4 space-y-4">
            {/* 标签 */}
            {image.tags.length > 0 && (
              <div>
                <strong className="text-sm text-gray-700 dark:text-gray-300">标签:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {image.tags.map((imageTag) => (
                    <span
                      key={imageTag.tag.id}
                      className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {imageTag.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong>尺寸:</strong> {image.width} × {image.height}
              </div>
              <div>
                <strong>格式:</strong> {image.format.toUpperCase()}
              </div>
              <div>
                <strong>文件大小:</strong> {formatFileSize(image.bytes)}
              </div>
              <div>
                <strong>上传时间:</strong> {new Date(image.createdAt).toLocaleString('zh-CN')}
              </div>
              {image.takenAt && (
                <div>
                  <strong>拍摄时间:</strong> {new Date(image.takenAt).toLocaleString('zh-CN')}
                </div>
              )}
              {image.location && (
                <div>
                  <strong>位置:</strong> {image.location}
                </div>
              )}
              {image.camera && (
                <div>
                  <strong>相机:</strong> {image.camera}
                </div>
              )}
              {image.lens && (
                <div>
                  <strong>镜头:</strong> {image.lens}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}