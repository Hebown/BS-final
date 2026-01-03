'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@mdi/react'
import { mdiMagnify, mdiClose, mdiTune, mdiRobot } from '@mdi/js'
import { cn } from '@/lib/utils'
import SearchFilterModal from './SearchFilterModal'
import { SearchParams } from '@/lib/actions/image-actions'

interface SearchBarProps {
  grayTheme?: boolean
  className?: string
  value?: string
  onChange?: (value: string) => void
  onFiltersChange?: (filters: SearchParams) => void
  initialFilters?: SearchParams
}

export default function SearchBar({ 
  grayTheme = false, 
  className,
  value: controlledValue,
  onChange,
  onFiltersChange,
  initialFilters = {},
}: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalValue, setInternalValue] = useState('')
  const [isSearchEnabled, setIsSearchEnabled] = useState(false)
  const [showClearIcon, setShowClearIcon] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState<SearchParams>(initialFilters)
  const [isMCPEnabled, setIsMCPEnabled] = useState(false) // MCP 模式开关
  const [isMCPLoading, setIsMCPLoading] = useState(false)

  // 使用受控或非受控值
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = controlledValue !== undefined 
    ? (newValue: string) => onChange?.(newValue)
    : setInternalValue

  useEffect(() => {
    setShowClearIcon(value.length > 0)
  }, [value])

  // 执行 MCP 智能搜索
  const performMCPSearch = async (query: string) => {
    setIsMCPLoading(true)
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        // 将搜索结果传递到搜索页面
        const params = new URLSearchParams()
        params.set('q', query.trim())
        params.set('mcp', 'true') // 标记这是 MCP 搜索
        
        // 将搜索结果存储到 sessionStorage，搜索页面会读取
        sessionStorage.setItem('mcpSearchResults', JSON.stringify(data.data))
        sessionStorage.setItem('mcpSearchParams', JSON.stringify(data.searchParams))
        
        router.push(`/search?${params.toString()}`)
      } else {
        // 如果 MCP 搜索失败，降级为普通搜索
        console.error('MCP 搜索失败:', data.error)
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    } catch (error) {
      console.error('MCP 搜索请求失败:', error)
      // 降级为普通搜索
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    } finally {
      setIsMCPLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      return
    }

    // 如果启用了 MCP 模式，使用 MCP 搜索
    if (isMCPEnabled) {
      await performMCPSearch(value.trim())
    } else {
      // 普通搜索
      router.push(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  // 切换 MCP 模式
  const handleToggleMCP = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMCPEnabled(!isMCPEnabled)
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
  }

  const handleFilterClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowFilterModal(true)
  }

  const handleFiltersApply = (newFilters: SearchParams) => {
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
    // 如果有搜索关键词，执行搜索
    if (value.trim() || Object.keys(newFilters).length > 0) {
      const params = new URLSearchParams()
      if (value.trim()) {
        params.set('q', value.trim())
      }
      // 添加筛选参数到 URL
      if (newFilters.tags && newFilters.tags.length > 0) {
        params.set('tags', newFilters.tags.join(','))
      }
      if (newFilters.startDate) {
        params.set('startDate', newFilters.startDate)
      }
      if (newFilters.endDate) {
        params.set('endDate', newFilters.endDate)
      }
      if (newFilters.camera) {
        params.set('camera', newFilters.camera)
      }
      if (newFilters.location) {
        params.set('location', newFilters.location)
      }
      router.push(`/search?${params.toString()}`)
    }
  }

  const onFocusIn = () => {
    setIsSearchEnabled(true)
  }

  const onFocusOut = () => {
    setIsSearchEnabled(false)
  }

  return (
    <div className={cn("w-full relative z-auto", className)} tabIndex={-1}>
      <form
        onSubmit={handleSubmit}
        className="select-text text-sm"
        role="search"
      >
        <div tabIndex={-1}>
          <label htmlFor="main-search-bar" className="sr-only">
            搜索你的照片
          </label>
          <input
            ref={inputRef}
            type="text"
            name="q"
            id="main-search-bar"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={onFocusIn}
            onBlur={onFocusOut}
            placeholder={isMCPEnabled ? "使用 AI 智能搜索..." : "搜索你的照片"}
            className={cn(
              "w-full transition-all border-2 ps-14 py-4 max-md:py-2 text-immich-fg/75 dark:text-immich-dark-fg",
              showClearIcon ? 'pe-28' : 'pe-20',
              grayTheme ? 'dark:bg-immich-dark-gray' : 'dark:bg-immich-dark-bg',
              'rounded-3xl bg-gray-200',
              isSearchEnabled 
                ? 'border-gray-200 dark:border-gray-700 bg-white' 
                : 'border-transparent',
              isMCPEnabled && 'border-primary/30 dark:border-primary/30'
            )}
            required
          />

          {/* 搜索图标 - 左侧 */}
          <div className="absolute inset-y-0 start-0 flex items-center ps-2">
            <IconButton
              type="submit"
              aria-label="搜索"
              icon={<Icon path={mdiMagnify} size={1} />}
              size="medium"
              shape="round"
              color="secondary"
              variant="ghost"
              title={isMCPEnabled ? "AI 智能搜索" : "普通搜索"}
              disabled={isMCPLoading}
              className={cn(
                isMCPLoading && "animate-pulse"
              )}
            />
          </div>

          {/* 右侧按钮组 */}
          <div className="absolute inset-y-0 end-0 flex items-center gap-1 pe-2">
            {/* MCP 开关按钮 */}
            <IconButton
              type="button"
              onClick={handleToggleMCP}
              aria-label={isMCPEnabled ? "关闭 AI 智能搜索" : "启用 AI 智能搜索"}
              icon={<Icon path={mdiRobot} size={1} />}
              size="medium"
              shape="round"
              color={isMCPEnabled ? "primary" : "secondary"}
              variant={isMCPEnabled ? "filled" : "ghost"}
              title={isMCPEnabled ? "AI 智能搜索已启用" : "点击启用 AI 智能搜索"}
              className={cn(
                isMCPEnabled && "ring-2 ring-primary/50"
              )}
            />

            {/* 筛选按钮 */}
            <IconButton
              type="button"
              aria-label="显示搜索选项"
              icon={<Icon path={mdiTune} size={1} />}
              onClick={handleFilterClick}
              size="medium"
              color="secondary"
              variant="ghost"
              shape="round"
            />

            {/* 清除按钮 */}
            {showClearIcon && (
              <IconButton
                type="button"
                onClick={handleClear}
                icon={<Icon path={mdiClose} size={1} />}
                aria-label="清除"
                size="medium"
                color="secondary"
                variant="ghost"
                shape="round"
              />
            )}
          </div>
        </div>
      </form>

      {/* 搜索筛选模态框 */}
      <SearchFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFiltersApply}
        initialFilters={filters}
      />
    </div>
  )
}
