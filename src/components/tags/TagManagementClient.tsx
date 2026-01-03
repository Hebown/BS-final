'use client'

import { useState } from 'react'
import { getAllTagsIncludingUnused, createOrUpdateTag, updateTagColor, deleteTag } from '@/lib/actions/tag-actions'
import TagCreateModal from './TagCreateModal'
import TagEditModal from './TagEditModal'
import { Button, Input, Field } from '@/components/ui'
import { Icon } from '@mdi/react'
import { mdiTag, mdiPlus, mdiPencil, mdiDelete, mdiArrowLeft } from '@mdi/js'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import ControlAppBar from '@/components/shared/ControlAppBar'

interface Tag {
  id: string
  name: string
  color: string | null
}

interface TagManagementClientProps {
  initialTags: Tag[]
}

export default function TagManagementClient({ initialTags }: TagManagementClientProps) {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateSuccess = (newTag: Tag) => {
    setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
    setShowCreateModal(false)
  }

  const handleEditSuccess = (updatedTag: Tag) => {
    setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t))
    setEditingTag(null)
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？删除后，所有使用此标签的图片将不再显示该标签。')) {
      return
    }

    const result = await deleteTag(tagId)
    if (result.success) {
      setTags(prev => prev.filter(t => t.id !== tagId))
    } else {
      alert(result.error || '删除失败')
    }
  }

  return (
    <>
      <ControlAppBar
        showBackButton={true}
        backIcon={mdiArrowLeft}
        onClose={() => router.push('/dashboard')}
      >
        <div className="flex items-center gap-3">
          <Icon path={mdiTag} size={1.2} />
          <h1 className="text-lg font-semibold">标签管理</h1>
        </div>
      </ControlAppBar>

      <div className="pt-20 p-6 max-w-4xl mx-auto">
        {/* 搜索和创建 */}
        <div className="flex gap-3 mb-6">
          <Input
            type="text"
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="filled"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Icon path={mdiPlus} size={1} />
            创建标签
          </Button>
        </div>

        {/* 标签列表 */}
        <div className="space-y-2">
          {filteredTags.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? '没有找到匹配的标签' : '还没有标签，点击上方按钮创建'}
            </div>
          ) : (
            filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-immich-dark-gray rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  />
                  <span className="font-medium text-immich-fg dark:text-immich-dark-fg">
                    {tag.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setEditingTag(tag)}
                    className="p-2"
                  >
                    <Icon path={mdiPencil} size={1} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleDelete(tag.id)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Icon path={mdiDelete} size={1} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 创建标签模态框 */}
      <TagCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 编辑标签模态框 */}
      {editingTag && (
        <TagEditModal
          isOpen={!!editingTag}
          onClose={() => setEditingTag(null)}
          tag={editingTag}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}


