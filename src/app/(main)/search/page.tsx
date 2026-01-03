'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { searchImages, SearchParams } from '@/lib/actions/image-actions'
import EmptyPlaceholder from '@/components/shared/EmptyPlaceholder'
import ControlAppBar from '@/components/shared/ControlAppBar'
import SearchBar from '@/components/search/SearchBar'
import SearchResultsGrid from '@/components/search/SearchResultsGrid'
import ImageModal from '@/components/ImageModal'
import { mdiArrowLeft } from '@mdi/js'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())
  const searchKeyword = searchParams.get('q') || ''
  const [previousRoute, setPreviousRoute] = useState('/dashboard')
  
  // 从 URL 参数构建筛选条件
  const buildFiltersFromParams = (): SearchParams => {
    const filters: SearchParams = {
      keyword: searchParams.get('q') || undefined,
    }
    const tags = searchParams.get('tags')
    if (tags) {
      filters.tags = tags.split(',').filter(Boolean)
    }
    const startDate = searchParams.get('startDate')
    if (startDate) {
      filters.startDate = startDate
    }
    const endDate = searchParams.get('endDate')
    if (endDate) {
      filters.endDate = endDate
    }
    const camera = searchParams.get('camera')
    if (camera) {
      filters.camera = camera
    }
    const location = searchParams.get('location')
    if (location) {
      filters.location = location
    }
    return filters
  }

  const [filters, setFilters] = useState<SearchParams>(buildFiltersFromParams())
  const [searchValue, setSearchValue] = useState(searchKeyword)

  // 记录之前的路由
  useEffect(() => {
    // 从 sessionStorage 获取之前的路由，如果没有则默认为 dashboard
    const storedRoute = sessionStorage.getItem('previousRoute')
    if (storedRoute) {
      setPreviousRoute(storedRoute)
    }
  }, [])

  // 执行搜索
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true)
      
      try {
        const result = await searchImages(filters)
        if (result.success && result.data) {
          setImages(result.data || [])
        } else {
          setImages([])
        }
      } catch (err) {
        setImages([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [filters])

  // 监听 URL 参数变化
  useEffect(() => {
    const newFilters = buildFiltersFromParams()
    // 简单比较，如果参数有变化则更新
    const currentParams = JSON.stringify(filters)
    const newParams = JSON.stringify(newFilters)
    if (currentParams !== newParams) {
      setFilters(newFilters)
    }
    const keyword = searchParams.get('q') || ''
    if (keyword !== searchValue) {
      setSearchValue(keyword)
    }
  }, [searchParams])

  const handleBack = () => {
    router.push(previousRoute)
  }

  // 导航函数
  const currentIndex = selectedImage 
    ? images.findIndex(img => img.id === selectedImage.id)
    : -1

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1])
    }
  }

  const handleImageSelect = (image: any, selected: boolean) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(image.id)
      } else {
        newSet.delete(image.id)
      }
      return newSet
    })
  }

  // 切换选择模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 Escape 退出选择模式
      if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false)
        setSelectedImageIds(new Set())
      }
      // 按 Ctrl/Cmd + A 进入选择模式
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isSelectionMode) {
        e.preventDefault()
        setIsSelectionMode(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionMode])

  return (
    <>
      {/* ControlAppBar - 固定在顶部 */}
      <ControlAppBar
        showBackButton={true}
        backIcon={mdiArrowLeft}
        onClose={handleBack}
        className="z-50"
      >
        <div className="w-full flex-1 ps-4">
          <SearchBar 
            grayTheme={false} 
            value={searchValue}
            onChange={setSearchValue}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters)
            }}
            initialFilters={filters}
          />
        </div>
      </ControlAppBar>

      {/* Selection Mode Toggle Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            setIsSelectionMode(!isSelectionMode)
            if (isSelectionMode) {
              setSelectedImageIds(new Set())
            }
          }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg",
            isSelectionMode
              ? "bg-immich-primary text-white hover:bg-immich-primary/90"
              : "bg-white dark:bg-immich-dark-gray text-immich-fg dark:text-immich-dark-fg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {isSelectionMode ? '取消选择' : '选择图片'}
        </button>
      </div>

      {/* 内容区域 - 添加顶部间距以避免被 AppBar 遮挡 */}
      <div className="mt-24 h-[calc(100vh-6rem)]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-immich-fg dark:text-immich-dark-fg">搜索中...</div>
          </div>
        ) : images.length > 0 ? (
          <SearchResultsGrid
            images={images}
            onImageClick={isSelectionMode ? undefined : setSelectedImage}
            isSelectionMode={isSelectionMode}
            selectedImageIds={selectedImageIds}
            onImageSelect={handleImageSelect}
          />
        ) : (
          <EmptyPlaceholder
            text="没有找到匹配的图片"
            className="mt-10 mx-auto"
          />
        )}
      </div>

      {selectedImage && !isSelectionMode && (
        <ImageModal
          image={selectedImage}
          images={images}
          onClose={() => setSelectedImage(null)}
          onNext={currentIndex < images.length - 1 ? handleNext : undefined}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
        />
      )}
    </>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

