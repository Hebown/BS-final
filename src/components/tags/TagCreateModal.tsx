'use client'

import { useState } from 'react'
import { createOrUpdateTag } from '@/lib/actions/tag-actions'
import { Button, Field, Input, Modal, ModalBody, ModalFooter, HStack } from '@/components/ui'
import { mdiTag } from '@mdi/js'

interface TagCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (tag: { id: string; name: string; color: string | null }) => void
}

export default function TagCreateModal({
  isOpen,
  onClose,
  onSuccess
}: TagCreateModalProps) {
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagName.trim()) {
      setError('标签名称不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createOrUpdateTag(tagName.trim(), tagColor)
      if (result.success && result.data) {
        setTagName('')
        setTagColor('#3b82f6')
        onSuccess?.(result.data)
        onClose()
      } else {
        setError(result.error || '创建标签失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建标签失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTagName('')
    setTagColor('#3b82f6')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal size="small" title="创建标签" icon={mdiTag} onClose={handleClose}>
      <ModalBody>
        <div className="text-primary">
          <p className="text-sm dark:text-immich-dark-fg">
            创建新标签
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" id="create-tag-form">
          {error && (
            <div className="my-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="my-4 flex flex-col gap-2">
            <Field label="标签名称" required className="[&_label]:uppercase [&_label]:immich-form-label">
              <Input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="输入标签名称"
                autoFocus
                required
              />
            </Field>

            <Field label="标签颜色" className="[&_label]:uppercase [&_label]:immich-form-label">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  type="text"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </Field>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <HStack fullWidth>
          <Button color="secondary" fullWidth shape="round" onClick={handleClose}>取消</Button>
          <Button type="submit" fullWidth shape="round" form="create-tag-form" disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>
  )
}

