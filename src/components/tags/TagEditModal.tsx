'use client'

import { useState, useEffect } from 'react'
import { updateTagColor } from '@/lib/actions/tag-actions'
import { Button, Field, Input, Modal, ModalBody, ModalFooter, HStack } from '@/components/ui'
import { mdiTag } from '@mdi/js'

interface TagEditModalProps {
  isOpen: boolean
  onClose: () => void
  tag: { id: string; name: string; color: string | null } | null
  onSuccess?: (tag: { id: string; name: string; color: string | null }) => void
}

export default function TagEditModal({
  isOpen,
  onClose,
  tag,
  onSuccess
}: TagEditModalProps) {
  const [tagColor, setTagColor] = useState('#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tag) {
      setTagColor(tag.color || '#3b82f6')
    }
  }, [tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateTagColor(tag.id, tagColor)
      if (result.success && result.data) {
        onSuccess?.(result.data)
        onClose()
      } else {
        setError(result.error || '更新标签失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新标签失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen || !tag) return null

  return (
    <Modal title="编辑标签" icon={mdiTag} onClose={handleClose}>
      <ModalBody>
        <form onSubmit={handleSubmit} autoComplete="off" id="edit-tag-form">
          {error && (
            <div className="my-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="my-4 flex flex-col gap-2">
            <Field label="标签名称" className="[&_label]:uppercase [&_label]:immich-form-label">
              <Input
                type="text"
                value={tag.name}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
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
          <Button type="submit" fullWidth shape="round" form="edit-tag-form" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>
  )
}

