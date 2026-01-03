// components/ImageEditor.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@mdi/react'
import { 
  mdiRotateLeft,
  mdiRotateRight,
  mdiPalette,
  mdiRefresh,
  mdiCheck,
  mdiClose
} from '@mdi/js'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { EditParams } from '@/lib/actions/image-actions'

interface ImageEditorProps {
  publicId: string
  secureUrl: string
  onSave: (editParams: EditParams, imageData: string, overwrite: boolean) => Promise<{ success: boolean; message?: string; error?: string }>
  onCancel: () => void
}

export default function ImageEditor({ 
  publicId, 
  secureUrl,
  onSave,
  onCancel
}: ImageEditorProps) {
  // 编辑参数状态
  const [editParams, setEditParams] = useState<EditParams>({
    effects: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
    },
    rotate: 0,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [overwrite, setOverwrite] = useState(false) // 是否覆盖原图
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null) // 用于导出的高质量 Canvas
  const imageRef = useRef<HTMLImageElement | null>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)

  // 加载原始图片
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      originalImageRef.current = img
      imageRef.current = img
      setImageLoaded(true)
      applyFilters()
    }
    img.src = secureUrl
  }, [secureUrl])

  // 应用滤镜效果到 Canvas
  const applyFilters = () => {
    const canvas = canvasRef.current
    const originalImg = originalImageRef.current
    if (!canvas || !originalImg) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const maxWidth = 800
    const maxHeight = 600
    let imgWidth = originalImg.width
    let imgHeight = originalImg.height

    // 计算缩放比例以适应预览区域
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1)
    const displayWidth = imgWidth * scale
    const displayHeight = imgHeight * scale

    // 应用旋转 - 如果是 90 或 270 度，需要交换宽高
    const angle = (editParams.rotate || 0) % 360
    const isRotated90 = angle === 90 || angle === 270
    const canvasWidth = isRotated90 ? displayHeight : displayWidth
    const canvasHeight = isRotated90 ? displayWidth : displayHeight

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 应用旋转
    if (angle !== 0) {
      ctx.save()
      // 移动到画布中心
      ctx.translate(canvasWidth / 2, canvasHeight / 2)
      // 旋转
      ctx.rotate(angle * Math.PI / 180)
      // 根据旋转角度调整平移，确保图片居中
      // 旋转后，图片的显示尺寸需要根据角度调整
      if (angle === 90 || angle === 270) {
        // 90 度或 270 度旋转：宽高已交换，平移时也要交换
        ctx.translate(-displayHeight / 2, -displayWidth / 2)
      } else {
        // 180 度或其他角度：保持原宽高
        ctx.translate(-displayWidth / 2, -displayHeight / 2)
      }
    } else {
      // 无旋转：居中显示
      ctx.translate((canvasWidth - displayWidth) / 2, (canvasHeight - displayHeight) / 2)
    }

    // 绘制图片（始终使用原始显示尺寸）
    ctx.drawImage(originalImg, 0, 0, displayWidth, displayHeight)

    if (angle !== 0) {
      ctx.restore()
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    // 应用滤镜效果
    // 亮度: -100 到 100，转换为 -1 到 1
    const brightness = (editParams.effects?.brightness || 0) / 100
    // 对比度: -100 到 100，转换为 -1 到 1
    const contrast = (editParams.effects?.contrast || 0) / 100
    // 饱和度: -100 到 100，转换为 -1 到 1
    const saturation = (editParams.effects?.saturation || 0) / 100

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // 应用亮度（线性调整）
      if (brightness !== 0) {
        const brightnessValue = brightness * 255
        r = Math.max(0, Math.min(255, r + brightnessValue))
        g = Math.max(0, Math.min(255, g + brightnessValue))
        b = Math.max(0, Math.min(255, b + brightnessValue))
      }

      // 应用对比度（使用标准对比度公式）
      if (contrast !== 0) {
        const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128))
        g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128))
        b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128))
      }

      // 应用饱和度（HSL 转换方法）
      if (saturation !== 0) {
        // 计算灰度值（使用标准权重）
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        // 饱和度调整：-1 到 1，-1 表示完全灰度，1 表示完全饱和
        const satFactor = 1 + saturation
        r = Math.max(0, Math.min(255, gray + satFactor * (r - gray)))
        g = Math.max(0, Math.min(255, gray + satFactor * (g - gray)))
        b = Math.max(0, Math.min(255, gray + satFactor * (b - gray)))
      }

      data[i] = Math.round(r)
      data[i + 1] = Math.round(g)
      data[i + 2] = Math.round(b)
    }

    // 将处理后的数据绘制回画布
    ctx.putImageData(imageData, 0, 0)
  }

  // 当编辑参数改变时重新应用滤镜
  useEffect(() => {
    if (imageLoaded) {
      applyFilters()
    }
  }, [editParams, imageLoaded])

  // 更新效果参数
  const updateEffect = (key: keyof NonNullable<EditParams['effects']>, value: number) => {
    setEditParams(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [key]: value
      }
    }))
  }

  // 旋转图片
  const rotate = (angle: number) => {
    setEditParams(prev => ({
      ...prev,
      rotate: ((prev.rotate ?? 0) + angle) % 360
    }))
  }

  // 重置所有编辑
  const reset = () => {
    setEditParams({
      effects: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
      rotate: 0,
      crop: undefined,
    })
  }

  // 从原始图片导出高质量图片数据
  const getCanvasImageData = (): string | null => {
    const originalImg = originalImageRef.current
    if (!originalImg) return null

    // 创建一个隐藏的 Canvas 用于导出，使用原始图片尺寸
    const exportCanvas = document.createElement('canvas')
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return null

    // 使用原始图片尺寸
    const imgWidth = originalImg.width
    const imgHeight = originalImg.height

    // 应用旋转 - 如果是 90 或 270 度，需要交换宽高
    const angle = (editParams.rotate || 0) % 360
    const isRotated90 = angle === 90 || angle === 270
    const canvasWidth = isRotated90 ? imgHeight : imgWidth
    const canvasHeight = isRotated90 ? imgWidth : imgHeight

    exportCanvas.width = canvasWidth
    exportCanvas.height = canvasHeight

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 应用旋转
    if (angle !== 0) {
      ctx.save()
      ctx.translate(canvasWidth / 2, canvasHeight / 2)
      ctx.rotate(angle * Math.PI / 180)
      ctx.translate(-imgWidth / 2, -imgHeight / 2)
    }

    // 绘制原始尺寸的图片
    ctx.drawImage(originalImg, 0, 0, imgWidth, imgHeight)

    if (angle !== 0) {
      ctx.restore()
    }

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    // 应用滤镜效果（与预览相同的逻辑）
    const brightness = (editParams.effects?.brightness || 0) / 100
    const contrast = (editParams.effects?.contrast || 0) / 100
    const saturation = (editParams.effects?.saturation || 0) / 100

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // 应用亮度
      if (brightness !== 0) {
        const brightnessValue = brightness * 255
        r = Math.max(0, Math.min(255, r + brightnessValue))
        g = Math.max(0, Math.min(255, g + brightnessValue))
        b = Math.max(0, Math.min(255, b + brightnessValue))
      }

      // 应用对比度
      if (contrast !== 0) {
        const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128))
        g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128))
        b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128))
      }

      // 应用饱和度
      if (saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const satFactor = 1 + saturation
        r = Math.max(0, Math.min(255, gray + satFactor * (r - gray)))
        g = Math.max(0, Math.min(255, gray + satFactor * (g - gray)))
        b = Math.max(0, Math.min(255, gray + satFactor * (b - gray)))
      }

      data[i] = Math.round(r)
      data[i + 1] = Math.round(g)
      data[i + 2] = Math.round(b)
    }

    // 将处理后的数据绘制回画布
    ctx.putImageData(imageData, 0, 0)

    // 导出为高质量 JPEG（质量 0.95）
    return exportCanvas.toDataURL('image/jpeg', 0.95)
  }

  // 保存编辑
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const imageData = getCanvasImageData()
      if (!imageData) {
        setSaveMessage({ type: 'error', text: '无法获取图片数据' })
        return
      }

      const result = await onSave(editParams, imageData, overwrite)
      if (result.success) {
        setSaveMessage({ type: 'success', text: result.message || '图片已保存' })
        // 延迟关闭编辑器，让用户看到成功消息
        setTimeout(() => {
          onCancel()
        }, 1500)
      } else {
        setSaveMessage({ type: 'error', text: result.error || '保存失败' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: error instanceof Error ? error.message : '保存失败' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左侧：图片预览区域 */}
        <div className="flex-1 flex items-center justify-center bg-immich-dark-gray rounded-lg overflow-hidden p-4">
          {imageLoaded ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%'
                }}
              />
            </div>
          ) : (
            <div className="text-gray-400">加载图片中...</div>
          )}
        </div>

        {/* 右侧：编辑控制面板 */}
        <div className="w-80 bg-immich-dark-bg border-l border-immich-dark-gray overflow-y-auto immich-scrollbar flex flex-col">
          <div className="p-4 space-y-6 flex-1">
            {/* 旋转控制 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon path={mdiRotateLeft} size={1} className="text-immich-dark-fg" />
                <h4 className="text-sm font-medium text-immich-dark-fg">旋转</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => rotate(-90)}
                  className="flex-1"
                  disabled={isSaving}
                >
                  <Icon path={mdiRotateLeft} size={1} className="mr-2" />
                  逆时针 90°
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => rotate(90)}
                  className="flex-1"
                  disabled={isSaving}
                >
                  <Icon path={mdiRotateRight} size={1} className="mr-2" />
                  顺时针 90°
                </Button>
              </div>
              {editParams.rotate !== 0 && (
                <div className="mt-2 text-xs text-gray-400 text-center">
                  当前: {editParams.rotate}°
                </div>
              )}
            </div>

            {/* 滤镜控制 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon path={mdiPalette} size={1} className="text-immich-dark-fg" />
                <h4 className="text-sm font-medium text-immich-dark-fg">滤镜效果</h4>
              </div>
              <div className="space-y-4">
                {/* 亮度 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">亮度</label>
                    <span className="text-sm text-gray-400">{editParams.effects?.brightness ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={editParams.effects?.brightness ?? 0}
                    onChange={(e) => updateEffect('brightness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-immich-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* 对比度 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">对比度</label>
                    <span className="text-sm text-gray-400">{editParams.effects?.contrast ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={editParams.effects?.contrast ?? 0}
                    onChange={(e) => updateEffect('contrast', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-immich-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* 饱和度 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">饱和度</label>
                    <span className="text-sm text-gray-400">{editParams.effects?.saturation ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={editParams.effects?.saturation ?? 0}
                    onChange={(e) => updateEffect('saturation', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-immich-primary"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* 覆盖选项 */}
            <div className="flex items-center gap-2 p-3 bg-immich-dark-gray rounded-lg">
              <input
                type="checkbox"
                id="overwrite-checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-immich-primary focus:ring-immich-primary focus:ring-offset-0"
                disabled={isSaving}
              />
              <label 
                htmlFor="overwrite-checkbox" 
                className="text-sm text-gray-400 cursor-pointer flex-1"
              >
                覆盖原图（不创建新图片）
              </label>
            </div>

            {/* 保存消息 */}
            {saveMessage && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                saveMessage.type === 'success' 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}>
                {saveMessage.text}
              </div>
            )}
          </div>

          {/* 操作按钮 - 固定在底部 */}
          <div className="p-4 border-t border-gray-700 bg-immich-dark-bg">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="medium"
                onClick={reset}
                className="flex-1"
                disabled={isSaving}
              >
                <Icon path={mdiRefresh} size={1} className="mr-2" />
                重置
              </Button>
              <Button
                variant="outline"
                size="medium"
                onClick={onCancel}
                className="flex-1"
                disabled={isSaving}
              >
                <Icon path={mdiClose} size={1} className="mr-2" />
                取消
              </Button>
              <Button
                size="medium"
                onClick={handleSave}
                loading={isSaving}
                className="flex-1"
              >
                <Icon path={mdiCheck} size={1} className="mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
