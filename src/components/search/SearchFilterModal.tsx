'use client'

import { useState, useEffect } from 'react'
import { SearchParams } from '@/lib/actions/image-actions'
import { Button } from '@/components/ui'
import { Icon } from '@mdi/react'
import { mdiClose, mdiTune } from '@mdi/js'
import { cn } from '@/lib/utils'
import SearchFilterSections from './SearchFilterSections'

interface SearchFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: SearchParams) => void
  initialFilters?: SearchParams
}

export default function SearchFilterModal({
  isOpen,
  onClose,
  onApply,
  initialFilters = {}
}: SearchFilterModalProps) {
  const [filters, setFilters] = useState<SearchParams>(initialFilters)

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-immich-dark-gray rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon path={mdiTune} size={1.2} />
            <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">
              搜索选项
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="关闭"
          >
            <Icon path={mdiClose} size={1} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <SearchFilterSections
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="large"
            onClick={handleReset}
            className="flex-1"
          >
            清除全部
          </Button>
          <Button
            variant="filled"
            size="large"
            onClick={handleApply}
            className="flex-1"
          >
            搜索
          </Button>
        </div>
      </div>
    </div>
  )
}

