'use client'

import { useState, useEffect } from 'react'
import { getAllTagsIncludingUnused as getAllTags, createOrUpdateTag } from '@/lib/actions/tag-actions'
import { setImageTags } from '@/lib/actions/image-tag-actions'
import { Input, Field, Button } from '@/components/ui'
import { Icon } from '@mdi/react'
import { mdiTag, mdiClose, mdiPlus } from '@mdi/js'
import { cn } from '@/lib/utils'

interface ImageTagEditorProps {
  imageId: string
  currentTags: Array<{ id: string; name: string; color: string | null }>
  onUpdate?: () => void
}

export default function ImageTagEditor({
  imageId,
  currentTags,
  onUpdate
}: ImageTagEditorProps) {
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; color: string | null }>>([])
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(currentTags.map(t => t.id)))
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    setSelectedTagIds(new Set(currentTags.map(t => t.id)))
  }, [currentTags])

  const loadTags = async () => {
    setIsLoading(true)
    try {
      const result = await getAllTags()
      if (result.success && result.data) {
        setAllTags(result.data)
      }
    } catch (error) {
      console.error('加载标签失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTagToggle = async (tagId: string) => {
    const newSet = new Set(selectedTagIds)
    if (newSet.has(tagId)) {
      newSet.delete(tagId)
    } else {
      newSet.add(tagId)
    }
    setSelectedTagIds(newSet)
    
    // 自动保存：选中或取消选中标签时立即保存
    setIsSubmitting(true)
    try {
      const result = await setImageTags(imageId, Array.from(newSet))
      if (result.success) {
        await loadTags()
        // 确保刷新在操作完成后执行
        onUpdate?.()
      }
    } catch (error) {
      console.error('保存标签失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createOrUpdateTag(newTagName.trim())
      if (result.success && result.data) {
        // 重新加载所有标签，确保数据是最新的
        await loadTags()
        // 自动选中新创建的标签并立即保存
        const newSet = new Set([...selectedTagIds, result.data!.id])
        setSelectedTagIds(newSet)
        setNewTagName('')
        setShowCreateTag(false)
        
        // 自动保存：创建标签后立即添加到图片并保存
        const saveResult = await setImageTags(imageId, Array.from(newSet))
        if (saveResult.success) {
          // 确保刷新在操作完成后执行
          onUpdate?.()
        }
      }
    } catch (error) {
      console.error('创建标签失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const result = await setImageTags(imageId, Array.from(selectedTagIds))
      if (result.success) {
        // 重新加载标签列表，确保新创建的标签被包含
        await loadTags()
        // 调用更新回调，刷新父组件
        onUpdate?.()
      }
    } catch (error) {
      console.error('保存标签失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentTagMap = new Map(currentTags.map(t => [t.id, t]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm uppercase immich-form-label flex items-center gap-2">
          <Icon path={mdiTag} size={1} />
          标签
        </h4>
        {isSubmitting && (
          <span className="text-xs text-gray-400">保存中...</span>
        )}
      </div>

      {/* 搜索和创建 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowCreateTag(!showCreateTag)}
            className="px-3"
          >
            <Icon path={mdiPlus} size={1} />
          </Button>
        </div>

        {showCreateTag && (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="新标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag()
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="filled"
              size="small"
              onClick={handleCreateTag}
              disabled={isSubmitting || !newTagName.trim()}
            >
              创建
            </Button>
          </div>
        )}
      </div>

      {/* 当前标签 */}
      {currentTags.length > 0 && (
        <div>
          <p className="text-xs uppercase immich-form-label mb-2">当前标签</p>
          <div className="flex flex-wrap gap-1">
            {currentTags.map((tag) => (
              <div key={tag.id} className="flex group transition-all">
                <span
                  className={cn(
                    "inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none rounded-s-full transition-all",
                    selectedTagIds.has(tag.id)
                      ? "text-gray-100 dark:text-immich-dark-gray bg-primary hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80"
                      : "text-immich-fg dark:text-immich-dark-fg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                  style={selectedTagIds.has(tag.id) && tag.color ? { backgroundColor: tag.color } : undefined}
                >
                  <p className="text-sm">{tag.name}</p>
                </span>
                {selectedTagIds.has(tag.id) && (
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
                    title="移除标签"
                  >
                    <Icon path={mdiClose} size={0.8} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 可用标签列表 */}
      {filteredTags.length > 0 && (
        <div>
          <p className="text-xs uppercase immich-form-label mb-2">可用标签</p>
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
            {filteredTags.map((tag) => {
              const isSelected = selectedTagIds.has(tag.id)
              const isCurrent = currentTagMap.has(tag.id)
              
              if (isCurrent) return null // 已在当前标签中显示
              
              return (
                <div key={tag.id} className="flex group transition-all">
                  <span
                    className={cn(
                      "inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none rounded-s-full transition-all cursor-pointer",
                      isSelected
                        ? "text-gray-100 dark:text-immich-dark-gray bg-primary hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80"
                        : "text-immich-fg dark:text-immich-dark-fg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    )}
                    style={isSelected && tag.color ? { backgroundColor: tag.color } : undefined}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <p className="text-sm">{tag.name}</p>
                  </span>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
                      title="移除标签"
                    >
                      <Icon path={mdiClose} size={0.8} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isLoading && filteredTags.length === 0 && currentTags.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          没有可用标签，点击 + 创建新标签
        </p>
      )}
    </div>
  )
}

