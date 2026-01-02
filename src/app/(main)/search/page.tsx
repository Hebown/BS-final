'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { searchImages, SearchParams } from '@/lib/actions/image-actions'
import TimelineClient from '@/components/timeline/TimelineClient'
import EmptyPlaceholder from '@/components/shared/EmptyPlaceholder'
import ControlAppBar from '@/components/shared/ControlAppBar'
import SearchBar from '@/components/search/SearchBar'
import { mdiArrowLeft } from '@mdi/js'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const searchKeyword = searchParams.get('q') || ''
  const [previousRoute, setPreviousRoute] = useState('/dashboard')
  const [filters, setFilters] = useState<SearchParams>({
    keyword: searchKeyword || undefined,
  })
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
    const keyword = searchParams.get('q')
    if (keyword !== filters.keyword) {
      setFilters({ keyword: keyword || undefined })
    }
  }, [searchParams, filters.keyword])

  const handleBack = () => {
    router.push(previousRoute)
  }

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
          />
        </div>
      </ControlAppBar>

      {/* 内容区域 - 添加顶部间距以避免被 AppBar 遮挡 */}
      <div className="mt-24">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-immich-fg dark:text-immich-dark-fg">搜索中...</div>
          </div>
        ) : images.length > 0 ? (
          <TimelineClient images={images} />
        ) : (
          <EmptyPlaceholder
            text="没有找到匹配的图片"
            className="mt-10 mx-auto"
          />
        )}
      </div>
    </>
  )
}

