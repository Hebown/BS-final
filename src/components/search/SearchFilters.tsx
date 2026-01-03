'use client'

import { useState } from 'react'
import { SearchParams } from '@/lib/actions/image-actions'
import { Button, Field, Input } from '@/components/ui'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'
import { Icon } from '@mdi/react'
import { mdiMagnify, mdiClose, mdiFilter, mdiCalendar, mdiCamera, mdiMapMarker } from '@mdi/js'

interface SearchFiltersProps {
  filters: SearchParams
  tags: Array<{ id: string; name: string; color: string | null }>
  onFiltersChange: (filters: SearchParams) => void
}

export default function SearchFilters({ filters, tags, onFiltersChange }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [keyword, setKeyword] = useState(filters.keyword || '')

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    onFiltersChange({ ...filters, keyword: value || undefined })
  }

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId]
    onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined })
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined })
  }

  const handleCameraChange = (value: string) => {
    onFiltersChange({ ...filters, camera: value || undefined })
  }

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value || undefined })
  }

  const clearFilters = () => {
    setKeyword('')
    onFiltersChange({})
  }

  const hasActiveFilters = !!(
    filters.keyword ||
    (filters.tags && filters.tags.length > 0) ||
    filters.startDate ||
    filters.endDate ||
    filters.camera ||
    filters.location
  )

  return (
    <div className="space-y-4">
      {/* 过滤器控制栏（搜索栏在 NavigationBar 中） */}
      <div className="flex items-center gap-2">
        <IconButton
          icon={<Icon path={mdiFilter} size={0.8} />}
          onClick={() => setShowAdvanced(!showAdvanced)}
          color={showAdvanced ? 'primary' : 'secondary'}
          variant={showAdvanced ? 'filled' : 'ghost'}
          aria-label="高级筛选"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="small"
            onClick={clearFilters}
            className="text-immich-fg dark:text-immich-dark-fg"
          >
            清除筛选
          </Button>
        )}
      </div>

      {/* 标签快速选择 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = filters.tags?.includes(tag.id)
            return (
              <Button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                variant={isSelected ? "filled" : "ghost"}
                color={isSelected ? "primary" : "secondary"}
                size="small"
                shape="round"
                style={isSelected && tag.color ? { backgroundColor: tag.color } : undefined}
              >
                {tag.name}
              </Button>
            )
          })}
        </div>
      )}

      {/* 高级筛选面板 */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-subtle dark:bg-immich-dark-gray rounded-lg border border-gray-200 dark:border-immich-dark-gray">
          {/* 开始日期 */}
          <Field label="开始日期">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              leadingIcon={<Icon path={mdiCalendar} size={0.8} />}
            />
          </Field>

          {/* 结束日期 */}
          <Field label="结束日期">
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              leadingIcon={<Icon path={mdiCalendar} size={0.8} />}
            />
          </Field>

          {/* 相机型号 */}
          <Field label="相机型号">
            <Input
              type="text"
              placeholder="例如: Canon EOS 5D"
              value={filters.camera || ''}
              onChange={(e) => handleCameraChange(e.target.value)}
              leadingIcon={<Icon path={mdiCamera} size={0.8} />}
            />
          </Field>

          {/* 地点 */}
          <Field label="地点">
            <Input
              type="text"
              placeholder="例如: 北京"
              value={filters.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              leadingIcon={<Icon path={mdiMapMarker} size={0.8} />}
            />
          </Field>
        </div>
      )}
    </div>
  )
}

