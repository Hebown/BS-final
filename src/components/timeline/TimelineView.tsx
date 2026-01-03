'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import LazyImage from '@/components/LazyImage'
import { formatGroupTitle } from '@/lib/utils/timeline-date-format'
import { getJustifiedLayoutFromAssets, type CommonPosition } from '@/lib/utils/layout-utils'
import { Icon } from '@mdi/react'
import { mdiCheckCircle, mdiCheckCircleOutline } from '@mdi/js'
import { Button } from '@/components/ui'

type DatabaseImage = {
  id: string
  title: string | null
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
  takenAt: Date | null
  location: string | null
  camera: string | null
  lens: string | null
  createdAt: Date
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string | null
    }
  }>
}

interface TimelineViewProps {
  images: DatabaseImage[]
  onImageClick?: (image: DatabaseImage) => void
  isSelectionMode?: boolean
  selectedImageIds?: Set<string>
  onImageSelect?: (image: DatabaseImage, selected: boolean) => void
  onShowSelected?: (images: DatabaseImage[]) => void
}

interface DayGroup {
  date: Date
  dateString: string
  images: DatabaseImage[]
  layout?: {
    containerHeight: number
    positions: CommonPosition[]
  }
  top: number
  left: number
  width: number
  height: number
}

interface MonthGroup {
  year: number
  month: number
  dayGroups: DayGroup[]
  top: number
  height: number
}

export default function TimelineView({ 
  images, 
  onImageClick,
  isSelectionMode = false,
  selectedImageIds = new Set(),
  onImageSelect,
  onShowSelected
}: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(800)
  const rowHeight = 235
  const spacing = 4
  const dayGroupSpacing = 32
  
  // 虚拟滚动配置：只渲染视口内和附近的图片
  const RENDER_BUFFER = 500 // 视口上下各多渲染 500px 的内容

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
        setViewportHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const scrollElement = scrollableRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [])

  const { monthGroups, totalHeight } = useMemo(() => {
    const dayGroupMap = new Map<string, DatabaseImage[]>()
    const monthGroupMap = new Map<string, { year: number; month: number; dayGroups: DayGroup[] }>()

    images.forEach((image) => {
      const date = image.takenAt || image.createdAt
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`

      if (!dayGroupMap.has(dateKey)) {
        dayGroupMap.set(dateKey, [])
      }
      dayGroupMap.get(dateKey)!.push(image)

      if (!monthGroupMap.has(monthKey)) {
        monthGroupMap.set(monthKey, {
          year,
          month,
          dayGroups: []
        })
      }
    })

    Array.from(dayGroupMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([dateKey, images]) => {
        const [year, month, day] = dateKey.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`
        const monthGroup = monthGroupMap.get(monthKey)
        
        if (monthGroup) {
          const dateString = formatGroupTitle(date, 'zh-CN')
          
          const sortedImages = images.sort((a, b) => {
            const dateA = a.takenAt || a.createdAt
            const dateB = b.takenAt || b.createdAt
            return dateB.getTime() - dateA.getTime()
          })

          const layout = getJustifiedLayoutFromAssets(
            sortedImages.map(img => ({ width: img.width, height: img.height })),
            {
              rowHeight,
              rowWidth: containerWidth - 60,
              spacing,
              heightTolerance: 0.25,
            }
          )

          const positions: CommonPosition[] = []
          for (let i = 0; i < sortedImages.length; i++) {
            positions.push(layout.getPosition(i))
          }

          monthGroup.dayGroups.push({
            date,
            dateString,
            images: sortedImages,
            layout: {
              containerHeight: layout.containerHeight,
              positions,
            },
            top: 0,
            left: 0,
            width: layout.containerWidth,
            height: layout.containerHeight,
          })
        }
      })

    const sortedMonths = Array.from(monthGroupMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    let currentTop = 0
    const processedMonths: MonthGroup[] = []

    sortedMonths.forEach((monthData) => {
      const monthTop = currentTop
      let monthHeight = 0

      monthData.dayGroups.forEach((dayGroup) => {
        dayGroup.top = currentTop
        dayGroup.left = 0
        currentTop += dayGroup.layout!.containerHeight + dayGroupSpacing
        monthHeight += dayGroup.layout!.containerHeight + dayGroupSpacing
      })

      processedMonths.push({
        year: monthData.year,
        month: monthData.month,
        dayGroups: monthData.dayGroups,
        top: monthTop,
        height: monthHeight,
      })
    })

    return {
      monthGroups: processedMonths,
      totalHeight: currentTop,
    }
  }, [images, containerWidth])

  const scrubberData = useMemo(() => {
    const segments = monthGroups.map((month) => ({
      year: month.year,
      month: month.month,
      title: `${month.year}年${month.month}月`,
      dateFormatted: `${month.year}年${month.month}月`,
      height: month.height,
      top: month.top,
      assetCount: month.dayGroups.reduce((sum, dg) => sum + dg.images.length, 0),
    }))

    const MIN_YEAR_LABEL_DISTANCE = 16
    const MIN_DOT_DISTANCE = 8
    
    let verticalSpanWithoutLabel = 0
    let verticalSpanWithoutDot = 0
    let previousLabeledSegment: typeof segments[0] | undefined

    return segments.map((segment) => {
      const hasLabel = (() => {
        if (!previousLabeledSegment) {
          previousLabeledSegment = segment
          return true
        }
        if (previousLabeledSegment.year !== segment.year && verticalSpanWithoutLabel > MIN_YEAR_LABEL_DISTANCE) {
          verticalSpanWithoutLabel = 0
          previousLabeledSegment = segment
          return true
        }
        return false
      })()

      const hasDot = (() => {
        if (!previousLabeledSegment) {
          return true
        }
        if (segment.height > 5 && verticalSpanWithoutDot > MIN_DOT_DISTANCE) {
          verticalSpanWithoutDot = 0
          return true
        }
        return false
      })()

      verticalSpanWithoutLabel += segment.height
      verticalSpanWithoutDot += segment.height

      return {
        ...segment,
        hasLabel,
        hasDot,
      }
    })
  }, [monthGroups])

  const viewportTopMonth = useMemo(() => {
    const viewportTop = scrollTop
    const viewportBottom = scrollTop + viewportHeight

    for (const month of monthGroups) {
      const monthTop = month.top
      const monthBottom = month.top + month.height

      if (viewportTop <= monthBottom && viewportBottom >= monthTop) {
        return {
          year: month.year,
          month: month.month,
          scrollPercent: Math.max(0, Math.min(1, (viewportTop - monthTop) / month.height)),
        }
      }
    }
    return null
  }, [scrollTop, viewportHeight, monthGroups])

  // 计算可见区域：只渲染视口内和缓冲区内的图片
  const visibleRange = useMemo(() => {
    const viewportTop = scrollTop - RENDER_BUFFER
    const viewportBottom = scrollTop + viewportHeight + RENDER_BUFFER
    
    // 找出所有在可见范围内的 dayGroup
    const visibleDayGroups: Set<string> = new Set()
    
    monthGroups.forEach((monthGroup) => {
      monthGroup.dayGroups.forEach((dayGroup) => {
        const dayGroupTop = dayGroup.top
        const dayGroupBottom = dayGroup.top + dayGroup.height
        
        // 如果 dayGroup 与可见区域有交集，标记为可见
        if (viewportTop <= dayGroupBottom && viewportBottom >= dayGroupTop) {
          visibleDayGroups.add(`${dayGroup.dateString}-${dayGroup.date.getTime()}`)
        }
      })
    })
    
    return visibleDayGroups
  }, [scrollTop, viewportHeight, monthGroups, RENDER_BUFFER])

  const handleScrubberClick = (year: number, month: number, percent: number) => {
    const monthGroup = monthGroups.find(m => m.year === year && m.month === month)
    if (monthGroup && scrollableRef.current) {
      const scrollTo = monthGroup.top + (monthGroup.height * percent)
      scrollableRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' })
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          还没有图片，快去上传一些吧！
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex">
      <div
        ref={scrollableRef}
        className="flex-1 overflow-y-auto scrollbar-hidden"
        style={{ marginRight: '60px' }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {monthGroups.map((monthGroup) => (
            monthGroup.dayGroups.map((dayGroup) => {
              const dayGroupKey = `${dayGroup.dateString}-${dayGroup.date.getTime()}`
              const isVisible = visibleRange.has(dayGroupKey)
              
              // 如果不在可见范围内，只渲染占位符以保持布局
              if (!isVisible) {
                return (
                  <section
                    key={dayGroupKey}
                    className="absolute"
                    style={{
                      top: `${dayGroup.top}px`,
                      left: `${dayGroup.left}px`,
                      width: `${dayGroup.width}px`,
                    }}
                  >
                    <div className="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm">
                      <span className="w-full truncate first-letter:capitalize" title={dayGroup.date.toLocaleDateString('zh-CN')}>
                        {dayGroup.dateString}
                      </span>
                    </div>
                    {dayGroup.layout && (
                      <div 
                        className="relative overflow-clip"
                        style={{ 
                          height: `${dayGroup.layout.containerHeight}px`,
                          width: `${dayGroup.width}px`
                        }}
                      />
                    )}
                  </section>
                )
              }
              
              return (
                <section
                  key={dayGroupKey}
                  className="absolute"
                  style={{
                    top: `${dayGroup.top}px`,
                    left: `${dayGroup.left}px`,
                    width: `${dayGroup.width}px`,
                  }}
                >
                  <div className="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm">
                    <span className="w-full truncate first-letter:capitalize" title={dayGroup.date.toLocaleDateString('zh-CN')}>
                      {dayGroup.dateString}
                    </span>
                  </div>

                  {dayGroup.layout && (
                    <div 
                      className="relative overflow-clip"
                      style={{ 
                        height: `${dayGroup.layout.containerHeight}px`,
                        width: `${dayGroup.width}px`
                      }}
                    >
                      {dayGroup.images.map((image, index) => {
                        const position = dayGroup.layout!.positions[index]
                        
                        return (
                          <div
                            key={image.id}
                            className={cn(
                              "absolute group cursor-pointer",
                              "transition-transform duration-150 ease-out",
                              "hover:z-10",
                              isSelectionMode && selectedImageIds.has(image.id) && "ring-2 ring-immich-primary ring-offset-2"
                            )}
                            style={{
                              top: `${position.top}px`,
                              left: `${position.left}px`,
                              width: `${position.width}px`,
                              height: `${position.height}px`,
                            }}
                            onClick={() => {
                              if (isSelectionMode) {
                                onImageSelect?.(image, !selectedImageIds.has(image.id))
                              } else {
                                onImageClick?.(image)
                              }
                            }}
                          >
                            <LazyImage
                              publicId={image.publicId}
                              secureUrl={image.secureUrl}
                              width={position.width}
                              height={position.height}
                              alt={image.title || `图片 ${image.publicId}`}
                              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                              placeholder="skeleton"
                              rootMargin="300px" // 提前 300px 开始加载
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                            
                            {/* 选择模式下的选中标记 */}
                            {isSelectionMode && (
                              <div className="absolute top-2 right-2">
                                <Icon
                                  path={selectedImageIds.has(image.id) ? mdiCheckCircle : mdiCheckCircleOutline}
                                  size={1.5}
                                  className={cn(
                                    "transition-colors",
                                    selectedImageIds.has(image.id)
                                      ? "text-immich-primary"
                                      : "text-white/80"
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })
          ))}
        </div>
      </div>

      <Scrubber
        data={scrubberData}
        totalHeight={totalHeight}
        viewportHeight={viewportHeight}
        scrollTop={scrollTop}
        viewportTopMonth={viewportTopMonth}
        onScrub={handleScrubberClick}
      />

      {/* 展示选定内容按钮 */}
      {isSelectionMode && selectedImageIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <Button
            variant="filled"
            size="large"
            onClick={() => {
              const selectedImages = images.filter(img => selectedImageIds.has(img.id))
              onShowSelected?.(selectedImages)
            }}
            className="shadow-lg"
          >
            展示选定内容 ({selectedImageIds.size})
          </Button>
        </div>
      )}
    </div>
  )
}

interface ScrubberProps {
  data: Array<{
    year: number
    month: number
    title: string
    dateFormatted: string
    height: number
    top: number
    assetCount: number
    hasLabel?: boolean
    hasDot?: boolean
  }>
  totalHeight: number
  viewportHeight: number
  scrollTop: number
  viewportTopMonth: { year: number; month: number; scrollPercent: number } | null
  onScrub: (year: number, month: number, percent: number) => void
}

function Scrubber({ data, totalHeight, viewportHeight, scrollTop, viewportTopMonth, onScrub }: ScrubberProps) {
  const scrubberRef = useRef<HTMLDivElement>(null)
  const [isHover, setIsHover] = useState(false)
  const [hoverY, setHoverY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const PADDING_TOP = 32
  const PADDING_BOTTOM = 10

  const segments = useMemo(() => {
    if (totalHeight === 0 || viewportHeight === 0) return []
    
    const availableHeight = viewportHeight - PADDING_TOP - PADDING_BOTTOM
    
    if (availableHeight <= 0) return []
    
    let currentTop = PADDING_TOP
    
    return data.map((month) => {
      const scrubberHeight = Math.max(1, (month.height / totalHeight) * availableHeight)
      const scrubberTop = currentTop
      
      currentTop += scrubberHeight
      
      return {
        ...month,
        scrubberTop,
        scrubberHeight,
      }
    })
  }, [data, totalHeight, viewportHeight])

  const scrollY = useMemo(() => {
    if (totalHeight === 0 || viewportHeight === 0) return PADDING_TOP
    const availableHeight = viewportHeight - PADDING_TOP - PADDING_BOTTOM
    if (availableHeight <= 0) return PADDING_TOP
    return PADDING_TOP + (scrollTop / totalHeight) * availableHeight
  }, [scrollTop, totalHeight, viewportHeight])

  const hoverLabel = useMemo(() => {
    if (!isHover && !isDragging) return null
    
    const y = hoverY
    for (const segment of segments) {
      if (y >= segment.scrubberTop && y <= segment.scrubberTop + segment.scrubberHeight) {
        const percent = (y - segment.scrubberTop) / segment.scrubberHeight
        return segment.title
      }
    }
    return null
  }, [isHover, isDragging, hoverY, segments])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrubberRef.current) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    setHoverY(y)
    
    if (isDragging) {
      for (const segment of segments) {
        if (y >= segment.scrubberTop && y <= segment.scrubberTop + segment.scrubberHeight) {
          const percent = (y - segment.scrubberTop) / segment.scrubberHeight
          onScrub(segment.year, segment.month, percent)
          break
        }
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleMouseMove(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={scrubberRef}
      className="absolute end-0 z-1 select-none hover:cursor-row-resize w-[60px] h-full pointer-events-auto"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false)
        setIsDragging(false)
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      role="scrollbar"
      aria-label="时间线导航"
      data-id="scrubber"
    >
      {hoverLabel && (isHover || isDragging) && (
        <div
          className={cn(
            "absolute end-0 min-w-20 max-w-64 w-fit rounded-ss-md border-b-2 border-immich-primary dark:border-immich-dark-primary py-1 px-2 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] bg-immich-bg dark:bg-immich-dark-bg opacity-90 pointer-events-none z-10",
            isDragging && "border-b-4 rounded-bl-md"
          )}
          style={{ top: `${hoverY + 2}px` }}
          id="time-label"
        >
          {hoverLabel}
        </div>
      )}

      {!isDragging && viewportTopMonth && (
        <div 
          className="absolute end-0 h-0.5 w-10 bg-immich-primary dark:bg-immich-dark-primary"
          style={{ top: `${scrollY - 2}px` }}
        />
      )}

      <div className="relative w-full" style={{ height: '100%' }}>
        <div
          className="relative"
          style={{ height: `${PADDING_TOP}px` }}
          data-id="lead-in"
          data-label={segments[0]?.dateFormatted}
        />

        {segments.map((segment) => (
          <div
            key={`${segment.year}-${segment.month}`}
            className="relative"
            data-id="time-segment"
            data-segment-year-month={`${segment.year}-${segment.month}`}
            data-label={segment.dateFormatted}
            style={{ 
              height: `${Math.max(1, segment.scrubberHeight)}px`,
            }}
          >
            {segment.hasLabel && (
              <div className="absolute end-5 text-[12px] dark:text-immich-dark-fg font-mono bottom-0 pointer-events-none whitespace-nowrap">
                {segment.year}
              </div>
            )}

            {segment.hasDot && (
              <div className="absolute end-3 bottom-0 h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-500 pointer-events-none" />
            )}
          </div>
        ))}

        <div
          className="relative"
          style={{ height: `${PADDING_BOTTOM}px` }}
          data-id="lead-out"
          data-label={segments[segments.length - 1]?.dateFormatted}
        />
      </div>
    </div>
  )
}
