'use client'

// 文件上传工具函数
// 参考 immich 的实现，适配我们的 Cloudinary 上传

export interface FileUploadOptions {
  multiple?: boolean
  albumId?: string
}

// 支持的图片格式
const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif',
  '.heic', '.heif', '.avif', '.svg'
]

export const getSupportedExtensions = (): string[] => {
  return SUPPORTED_IMAGE_EXTENSIONS
}

// 打开文件选择对话框
export const openFileUploadDialog = async (
  options: FileUploadOptions = {}
): Promise<File[]> => {
  const { multiple = true } = options
  const extensions = getSupportedExtensions()

  return new Promise((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input')
      fileSelector.type = 'file'
      fileSelector.multiple = multiple
      fileSelector.accept = extensions.join(',')
      
      fileSelector.addEventListener(
        'change',
        (e: Event) => {
          const target = e.target as HTMLInputElement
          if (!target.files) {
            resolve([])
            return
          }
          const files = Array.from(target.files)
          resolve(files)
        },
        { passive: true }
      )

      fileSelector.click()
    } catch (error) {
      console.error('Error selecting file', error)
      reject(error)
    }
  })
}

// 生成设备资产 ID（用于跟踪上传）
export const getDeviceAssetId = (file: File): string => {
  return `web-${file.name}-${file.lastModified}`
}

