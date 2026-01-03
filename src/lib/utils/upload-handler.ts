'use client'

import { uploadImage } from '@/lib/actions/image-actions'
import { useUploadStore, UploadState, type UploadAsset } from '@/lib/stores/upload'
import { getSupportedExtensions, getDeviceAssetId } from './file-uploader'

// 处理单个文件上传
async function uploadSingleFile(
  file: File,
  deviceAssetId: string,
  uploadStore: ReturnType<typeof useUploadStore.getState>
): Promise<string | null> {
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
    // 减少更新频率：从 100ms 改为 500ms，减少重新渲染
    const fileSize = file.size
    let uploaded = 0
    const progressInterval = setInterval(() => {
      uploaded += fileSize / 10
      if (uploaded < fileSize) {
        uploadStore.updateProgress(deviceAssetId, uploaded, fileSize)
      } else {
        clearInterval(progressInterval)
      }
    }, 500) // 从 100ms 改为 500ms
    
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
      return result.data.public_id
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
    return null
  }
}

// 处理文件上传（批量处理，减少重新渲染）
export const handleFileUpload = async (files: File[]): Promise<string[]> => {
  const uploadStore = useUploadStore.getState()
  const extensions = getSupportedExtensions()
  const results: string[] = []

  // 过滤支持的文件
  const validFiles = files.filter(file => {
    const name = file.name.toLowerCase()
    return extensions.some(ext => name.endsWith(ext))
  })

  if (validFiles.length === 0) {
    return results
  }

  // 批量添加所有文件到 store（一次性操作，减少重新渲染）
  const uploadTasks = validFiles.map(file => {
    const deviceAssetId = getDeviceAssetId(file)
    return { file, deviceAssetId, asset: { id: deviceAssetId, file } as UploadAsset }
  })

  // 一次性批量添加所有任务（减少重新渲染）
  uploadStore.addItems(uploadTasks.map(t => t.asset))

  // 并发控制：同时上传多个文件（默认并发数为2）
  const concurrency = 2
  const uploadPromises: Promise<string | null>[] = []
  
  for (let i = 0; i < uploadTasks.length; i += concurrency) {
    const batch = uploadTasks.slice(i, i + concurrency)
    const batchPromises = batch.map(({ file, deviceAssetId }) =>
      uploadSingleFile(file, deviceAssetId, uploadStore)
    )
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter((r): r is string => r !== null))
  }

  // 所有上传完成后，统一刷新页面数据（只刷新一次）
  if (results.length > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('data-refresh', { 
      detail: { paths: ['/dashboard'] } 
    }))
  }

  // 延迟批量移除已完成的上传项（减少重新渲染）
  setTimeout(() => {
    const completedIds = uploadTasks
      .map(({ deviceAssetId }) => {
        const upload = uploadStore.uploads.find(u => u.id === deviceAssetId)
        return upload && (upload.state === UploadState.DONE || upload.state === UploadState.ERROR)
          ? deviceAssetId
          : null
      })
      .filter((id): id is string => id !== null)
    
    if (completedIds.length > 0) {
      uploadStore.removeItems(completedIds)
    }
  }, 2000)

  return results
}

