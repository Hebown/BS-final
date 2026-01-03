'use client'

import { useState, useEffect } from 'react'
import { SearchParams } from '@/lib/actions/image-actions'
import { Button, Modal, ModalBody, ModalFooter, HStack } from '@/components/ui'
import { mdiTune } from '@mdi/js'
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
  const formId = `search-filter-form-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleApply()
  }

  if (!isOpen) return null

  return (
    <Modal icon={mdiTune} size="giant" title="搜索选项" onClose={onClose}>
      <ModalBody>
        <form id={formId} autoComplete="off" onSubmit={handleSubmit} onReset={handleReset}>
          <div className="flex flex-col gap-4 pb-10" tabIndex={-1}>
            <SearchFilterSections
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <HStack fullWidth>
          <Button shape="round" size="large" type="reset" color="secondary" fullWidth form={formId}>
            清除全部
          </Button>
          <Button shape="round" size="large" type="submit" fullWidth form={formId}>
            搜索
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>
  )
}

