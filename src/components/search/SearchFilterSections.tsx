'use client'

import { useState, useEffect } from 'react'
import { SearchParams } from '@/lib/actions/image-actions'
import { getAllTags } from '@/lib/actions/image-actions'
import { Input, Field } from '@/components/ui'
import { Icon } from '@mdi/react'
import { mdiCalendar, mdiCamera, mdiMapMarker, mdiTag } from '@mdi/js'
import { cn } from '@/lib/utils'

interface SearchFilterSectionsProps {
  filters: SearchParams
  onFiltersChange: (filters: SearchParams) => void
}

export default function SearchFilterSections({
  filters,
  onFiltersChange
}: SearchFilterSectionsProps) {
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string | null }>>([])
  const [loadingTags, setLoadingTags] = useState(false)

  useEffect(() => {
    const loadTags = async () => {
      setLoadingTags(true)
      try {
        const result = await getAllTags()
        if (result.success && result.data) {
          setTags(result.data.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          })))
        }
      } catch (error) {
        console.error('加载标签失败:', error)
      } finally {
        setLoadingTags(false)
      }
    }
    loadTags()
  }, [])

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

  const invalidDateRange = filters.startDate && filters.endDate && filters.startDate > filters.endDate

  return (
    <div className="flex flex-col gap-6">
      {/* 标签选择 */}
      {tags.length > 0 && (
        <div>
          <label className="uppercase text-sm immich-form-label text-immich-fg dark:text-immich-dark-fg mb-2 block">
            <Icon path={mdiTag} size={0.8} className="inline mr-1" />
            标签
          </label>
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => {
              const isSelected = filters.tags?.includes(tag.id)
              return (
                <span
                  key={tag.id}
                  className={cn(
                    "inline-block h-min whitespace-nowrap ps-3 pe-3 py-1 text-center align-baseline leading-none rounded-full transition-all cursor-pointer",
                    isSelected
                      ? "text-gray-100 dark:text-immich-dark-gray bg-primary hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80"
                      : "text-immich-fg dark:text-immich-dark-fg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                  style={isSelected && tag.color ? { backgroundColor: tag.color } : undefined}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  <p className="text-sm">{tag.name}</p>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* 日期范围 */}
      <div>
        <label className="uppercase text-sm immich-form-label text-immich-fg dark:text-immich-dark-fg mb-2 block">
          <Icon path={mdiCalendar} size={0.8} className="inline mr-1" />
          日期范围
        </label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="开始日期">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className={invalidDateRange ? 'border-red-500' : ''}
            />
          </Field>
          <Field label="结束日期">
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className={invalidDateRange ? 'border-red-500' : ''}
            />
          </Field>
        </div>
        {invalidDateRange && (
          <p className="text-red-500 text-sm mt-1">开始日期必须早于结束日期</p>
        )}
      </div>

      {/* 相机型号 */}
      <div>
        <label className="uppercase text-sm immich-form-label text-immich-fg dark:text-immich-dark-fg mb-2 block">
          <Icon path={mdiCamera} size={0.8} className="inline mr-1" />
          相机
        </label>
        <Field>
          <Input
            type="text"
            placeholder="例如: Canon EOS 5D"
            value={filters.camera || ''}
            onChange={(e) => handleCameraChange(e.target.value)}
            leadingIcon={<Icon path={mdiCamera} size={0.8} />}
          />
        </Field>
      </div>

      {/* 地点 */}
      <div>
        <label className="uppercase text-sm immich-form-label text-immich-fg dark:text-immich-dark-fg mb-2 block">
          <Icon path={mdiMapMarker} size={0.8} className="inline mr-1" />
          地点
        </label>
        <Field>
          <Input
            type="text"
            placeholder="例如: 北京"
            value={filters.location || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            leadingIcon={<Icon path={mdiMapMarker} size={0.8} />}
          />
        </Field>
      </div>
    </div>
  )
}

