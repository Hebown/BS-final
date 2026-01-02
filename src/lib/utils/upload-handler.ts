'use client'

import { uploadImage } from '@/lib/actions/image-actions'
import { useUploadStore, UploadState } from '@/lib/stores/upload'
import { getSupportedExtensions, getDeviceAssetId } from './file-uploader'

// 处理文件上传
export const handleFileUpload = async (files: File[]): Promise<string[]> => {
  const uploadStore = useUploadStore.getState()
  const extensions = getSupportedExtensions()
  const results: string[] = []

  // 过滤支持的文件
  const validFiles = files.filter(file => {
    const name = file.name.toLowerCase()
    return extensions.some(ext => name.endsWith(ext))
  })

  // 为每个文件创建上传任务
  for (const file of validFiles) {
    const deviceAssetId = getDeviceAssetId(file)
    uploadStore.addItem({ id: deviceAssetId, file })

    try {
      uploadStore.markStarted(deviceAssetId)
      uploadStore.updateItem(deviceAssetId, { message: '准备上传...' })

      // 创建 FormData
      const formData = new FormData()
      formData.append('image', file)
      formData.append('title', file.name)

      // 上传到 Cloudinary
      uploadStore.updateItem(deviceAssetId, { message: '上传中...' })
      
      // 模拟上传进度（因为 Server Action 不支持进度回调）
      // 实际进度可以通过 XMLHttpRequest 实现，但这里简化处理
      const fileSize = file.size
      let uploaded = 0
      const progressInterval = setInterval(() => {
        uploaded += fileSize / 10
        if (uploaded < fileSize) {
          uploadStore.updateProgress(deviceAssetId, uploaded, fileSize)
        } else {
          clearInterval(progressInterval)
        }
      }, 100)
      
      const result = await uploadImage(null, formData)
      clearInterval(progressInterval)

      if (result.success && result.data) {
        uploadStore.updateProgress(deviceAssetId, fileSize, fileSize)
        uploadStore.updateItem(deviceAssetId, {
          state: UploadState.DONE,
          assetId: result.data.public_id,
          message: '上传成功',
        })
        uploadStore.track('success')
        results.push(result.data.public_id)

        // 刷新页面数据
        if (typeof window !== 'undefined') {
          // 触发路由刷新
          window.dispatchEvent(new Event('upload-complete'))
        }

        // 1秒后移除已完成的上传项
        setTimeout(() => {
          uploadStore.removeItem(deviceAssetId)
        }, 1000)
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      uploadStore.updateItem(deviceAssetId, {
        state: UploadState.ERROR,
        error: errorMessage,
        message: errorMessage,
      })
      uploadStore.track('error')
    }
  }

  return results
}

