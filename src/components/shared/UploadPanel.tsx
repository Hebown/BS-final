'use client'

import { useState, useEffect } from 'react'
import { useUploadStore, UploadState } from '@/lib/stores/upload'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@mdi/react'
import { 
  mdiCancel, 
  mdiCloudUploadOutline, 
  mdiCog, 
  mdiWindowMinimize,
  mdiCircleOutline,
  mdiLoading,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiClose,
  mdiRestart,
  mdiOpenInNew,
  mdiTrashCan,
} from '@mdi/js'
import { cn } from '@/lib/utils'

export default function UploadPanel() {
  const { uploads, stats, isUploading, isDismissible, remainingUploads } = useUploadStore()
  const [showDetail, setShowDetail] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  if (!isUploading) {
    return null
  }

  return (
    <div className="fixed bottom-6 end-16">
      {showDetail ? (
        <div className="w-81 rounded-xl border border-gray-200 dark:border-subtle p-4 text-sm shadow-xs bg-subtle">
          <div className="place-item-center mb-4 flex justify-between">
            <div className="flex flex-col gap-1">
              <p className="immich-form-label text-xm">
                上传进度: {remainingUploads} / {stats.total}
              </p>
              <p className="immich-form-label text-xs">
                已上传: <span className="text-success">{stats.success}</span>
                {' - '}
                错误: <span className="text-danger">{stats.errors}</span>
                {' - '}
                重复: <span className="text-warning">{stats.duplicates}</span>
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex flex-row">
                <IconButton
                  variant="ghost"
                  shape="round"
                  color="secondary"
                  icon={<Icon path={mdiCog} size={1} />}
                  size="small"
                  onClick={() => setShowOptions(!showOptions)}
                  aria-label="设置"
                />
                <IconButton
                  variant="ghost"
                  shape="round"
                  color="secondary"
                  aria-label="最小化"
                  icon={<Icon path={mdiWindowMinimize} size={1} />}
                  size="small"
                  onClick={() => setShowDetail(false)}
                />
              </div>
              {isDismissible && (
                <IconButton
                  variant="ghost"
                  shape="round"
                  color="secondary"
                  aria-label="清除错误"
                  icon={<Icon path={mdiCancel} size={1} />}
                  size="small"
                  onClick={() => useUploadStore.getState().dismissErrors()}
                />
              )}
            </div>
          </div>

          {showOptions && (
            <div className="immich-scrollbar mb-4 max-h-100 overflow-y-auto rounded-lg">
              <div className="flex h-6.5 place-items-center gap-1">
                <label className="immich-form-label" htmlFor="upload-concurrency">
                  并发数
                </label>
              </div>
              <input
                className="immich-form-input w-full"
                id="upload-concurrency"
                name="upload-concurrency"
                type="number"
                min="1"
                max="50"
                step="1"
                defaultValue={2}
                readOnly
              />
            </div>
          )}

          <div className="immich-scrollbar flex max-h-[400px] flex-col gap-2 overflow-y-auto rounded-lg">
            {uploads.map((upload) => (
              <UploadAssetPreview key={upload.id} upload={upload} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative rounded-full">
          {remainingUploads > 0 && (
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="absolute -start-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-primary text-xs text-gray-200"
            >
              {remainingUploads}
            </button>
          )}
          {stats.errors > 0 && (
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="absolute -end-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-danger text-xs text-gray-200"
            >
              {stats.errors}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="flex h-16 w-16 place-content-center place-items-center rounded-full bg-subtle text-sm text-primary shadow-lg"
          >
            <div className="animate-pulse">
              <Icon path={mdiCloudUploadOutline} size="30px" />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

function UploadAssetPreview({ upload }: { upload: any }) {
  const progress = upload.progress || 0
  const state = upload.state || UploadState.PENDING
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // 生成图片预览
  useEffect(() => {
    if (upload.file && upload.file instanceof File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(upload.file)
    }
  }, [upload.file])

  const handleDismiss = () => {
    useUploadStore.getState().removeItem(upload.id)
  }

  const handleRetry = async () => {
    const { handleFileUpload } = await import('@/lib/utils/upload-handler')
    useUploadStore.getState().removeItem(upload.id)
    await handleFileUpload([upload.file])
  }

  // 获取状态图标（immich风格）
  const getStateIcon = () => {
    switch (state) {
      case UploadState.PENDING:
        return <Icon path={mdiCircleOutline} size="24px" className="text-primary" />
      case UploadState.STARTED:
        return <Icon path={mdiLoading} size="24px" className="text-primary animate-spin" />
      case UploadState.ERROR:
        return <Icon path={mdiAlertCircle} size="24px" className="text-danger" />
      case UploadState.DUPLICATED:
        return upload.isTrashed ? (
          <Icon path={mdiTrashCan} size="24px" className="text-gray-500" />
        ) : (
          <Icon path={mdiAlertCircle} size="24px" className="text-warning" />
        )
      case UploadState.DONE:
        return <Icon path={mdiCheckCircle} size="24px" className="text-success" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col rounded-xl text-xs p-2 gap-1 border border-gray-300 dark:border-subtle bg-primary/10">
      <div className="flex items-center gap-2">
        {/* 状态图标 - immich风格 */}
        <div className="flex items-center justify-center shrink-0">
          {getStateIcon()}
        </div>

        {/* 文件名 */}
        <span className="grow break-all text-xs">{upload.file.name}</span>

        {/* 操作按钮 - immich风格 */}
        {state === UploadState.DUPLICATED && upload.assetId && (
          <div className="flex items-center justify-between gap-1">
            <IconButton
              variant="ghost"
              shape="round"
              color="secondary"
              size="small"
              icon={<Icon path={mdiOpenInNew} size="20px" />}
              onClick={() => {
                // TODO: 打开图片链接
                console.log('Open asset:', upload.assetId)
              }}
              aria-label="查看"
            />
            <IconButton
              variant="ghost"
              shape="round"
              color="secondary"
              size="small"
              icon={<Icon path={mdiClose} size="20px" />}
              onClick={handleDismiss}
              aria-label="关闭"
            />
          </div>
        )}
        {state === UploadState.ERROR && (
          <div className="flex items-center justify-between gap-1">
            <IconButton
              variant="ghost"
              shape="round"
              color="secondary"
              size="small"
              icon={<Icon path={mdiRestart} size="20px" />}
              onClick={handleRetry}
              aria-label="重试"
            />
            <IconButton
              variant="ghost"
              shape="round"
              color="secondary"
              size="small"
              icon={<Icon path={mdiClose} size="20px" />}
              onClick={handleDismiss}
              aria-label="关闭"
            />
          </div>
        )}
      </div>

      {/* 进度条 - immich风格 */}
      {state === UploadState.STARTED && (
        <div className="text-black relative mt-[5px] h-4.5 w-full rounded-md bg-gray-300 dark:bg-gray-700">
          <div
            className="h-4.5 rounded-md bg-immich-primary transition-all"
            style={{ width: `${progress}%` }}
          />
          <p className="absolute top-0.5 h-full w-full text-center text-white text-[10px]">
            {upload.message || `${Math.round(progress)}%`}
            {upload.speed && upload.eta && (
              <> - {formatBytes(upload.speed)}/s - {upload.eta}s</>
            )}
          </p>
        </div>
      )}

      {/* 错误消息 - immich风格 */}
      {state === UploadState.ERROR && upload.error && (
        <div className="flex flex-row justify-between">
          <p className="w-full rounded-md text-justify text-danger text-xs">
            {String(upload.error)}
          </p>
        </div>
      )}
    </div>
  )
}

// 格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(1)} ${sizes[i]}`
}

