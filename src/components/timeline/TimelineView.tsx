'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import MyImage from '@/components/MyImage'
import { formatGroupTitle } from '@/lib/utils/timeline-date-format'
import { getJustifiedLayoutFromAssets, type CommonPosition } from '@/lib/utils/layout-utils'

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

export default function TimelineView({ images, onImageClick }: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(800)
  const rowHeight = 235 // immich 默认行高
  const spacing = 4 // 图片间距
  const dayGroupSpacing = 32 // 日期组之间的间距

  // 监听容器宽度变化
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

  // 监听滚动
  useEffect(() => {
    const scrollElement = scrollableRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [])

  // 按年月日分组图片，并使用 justified-layout 计算布局（immich风格）
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

      // 添加到日期组
      if (!dayGroupMap.has(dateKey)) {
        dayGroupMap.set(dateKey, [])
      }
      dayGroupMap.get(dateKey)!.push(image)

      // 创建或获取月份组
      if (!monthGroupMap.has(monthKey)) {
        monthGroupMap.set(monthKey, {
          year,
          month,
          dayGroups: []
        })
      }
    })

    // 将日期组添加到月份组，并计算布局
    Array.from(dayGroupMap.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // 降序排列
      .forEach(([dateKey, images]) => {
        const [year, month, day] = dateKey.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`
        const monthGroup = monthGroupMap.get(monthKey)
        
        if (monthGroup) {
          // 使用 immich 风格的日期格式化
          const dateString = formatGroupTitle(date, 'zh-CN')
          
          // 排序图片
          const sortedImages = images.sort((a, b) => {
            const dateA = a.takenAt || a.createdAt
            const dateB = b.takenAt || b.createdAt
            return dateB.getTime() - dateA.getTime()
          })

          // 使用 justified-layout 计算布局
          const layout = getJustifiedLayoutFromAssets(
            sortedImages.map(img => ({ width: img.width, height: img.height })),
            {
              rowHeight,
              rowWidth: containerWidth - 60, // 减去 Scrubber 宽度
              spacing,
              heightTolerance: 0.25, // immich 默认容差
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
            top: 0, // 将在后面计算
            left: 0,
            width: layout.containerWidth,
            height: layout.containerHeight,
          })
        }
      })

    // 排序月份组并计算位置
    const sortedMonths = Array.from(monthGroupMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    // 计算每个日期组和月份组的位置
    let currentTop = 0
    const processedMonths: MonthGroup[] = []

    sortedMonths.forEach((monthData) => {
      const monthTop = currentTop
      let monthHeight = 0

      // 计算每个日期组的位置
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

  // 计算 Scrubber 数据（标尺类型，类似 immich）
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

    // 计算标签和点（类似 immich 的逻辑）
    const MIN_YEAR_LABEL_DISTANCE = 16 // 最小年份标签距离
    const MIN_DOT_DISTANCE = 8 // 最小点距离
    
    let verticalSpanWithoutLabel = 0
    let verticalSpanWithoutDot = 0
    let previousLabeledSegment: typeof segments[0] | undefined

    return segments.map((segment, index) => {
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

  // 计算当前视口显示的月份
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

  // Scrubber 点击处理
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
      {/* 主时间线内容 */}
      <div
        ref={scrollableRef}
        className="flex-1 overflow-y-auto scrollbar-hidden"
        style={{ marginRight: '60px' }} // Scrubber 宽度
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {monthGroups.map((monthGroup) => (
            monthGroup.dayGroups.map((dayGroup) => (
              <section
                key={`${dayGroup.dateString}-${dayGroup.date.getTime()}`}
                className="absolute"
                style={{
                  top: `${dayGroup.top}px`,
                  left: `${dayGroup.left}px`,
                  width: `${dayGroup.width}px`,
                }}
              >
                {/* 日期标题 - immich风格，显示在每个日期组上方 */}
                <div className="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm">
                  <span className="w-full truncate first-letter:capitalize" title={dayGroup.date.toLocaleDateString('zh-CN')}>
                    {dayGroup.dateString}
                  </span>
                </div>

                {/* 图片网格 - immich风格，使用 justified-layout */}
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
                            "hover:z-10"
                          )}
                          style={{
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                            width: `${position.width}px`,
                            height: `${position.height}px`,
                          }}
                          onClick={() => onImageClick?.(image)}
                        >
                          <MyImage
                            publicId={image.publicId}
                            secureUrl={image.secureUrl}
                            width={position.width}
                            height={position.height}
                            alt={image.title || `图片 ${image.publicId}`}
                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            loading="lazy"
                          />
                          {/* 悬停时的叠加层 - immich风格 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            ))
          ))}
        </div>
      </div>

      {/* Scrubber - 右侧时间线（标尺类型） */}
      <Scrubber
        data={scrubberData}
        totalHeight={totalHeight}
        viewportHeight={viewportHeight}
        scrollTop={scrollTop}
        viewportTopMonth={viewportTopMonth}
        onScrub={handleScrubberClick}
      />
    </div>
  )
}

// Scrubber 组件 - 右侧时间线（标尺类型，类似 immich）
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

  // 计算每个月份段在 Scrubber 中的位置（考虑内边距）
  const segments = useMemo(() => {
    if (totalHeight === 0 || viewportHeight === 0) return []
    
    const PADDING_TOP = 32
    const PADDING_BOTTOM = 10
    const availableHeight = viewportHeight - PADDING_TOP - PADDING_BOTTOM
    
    if (availableHeight <= 0) return []
    
    return data.map((month) => {
      const scrubberTop = PADDING_TOP + (month.top / totalHeight) * availableHeight
      const scrubberHeight = Math.max(1, (month.height / totalHeight) * availableHeight)
      
      return {
        ...month,
        scrubberTop,
        scrubberHeight,
      }
    })
  }, [data, totalHeight, viewportHeight])

  // 计算当前滚动位置在 Scrubber 中的位置（考虑内边距）
  const scrollY = useMemo(() => {
    if (totalHeight === 0 || viewportHeight === 0) return 0
    const PADDING_TOP = 32
    const PADDING_BOTTOM = 10
    const availableHeight = viewportHeight - PADDING_TOP - PADDING_BOTTOM
    if (availableHeight <= 0) return PADDING_TOP
    return PADDING_TOP + (scrollTop / totalHeight) * availableHeight
  }, [scrollTop, totalHeight, viewportHeight])

  // 计算悬停标签
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
      // 找到对应的月份并滚动
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

  const PADDING_TOP = 32 // 顶部内边距
  const PADDING_BOTTOM = 10 // 底部内边距

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
      {/* 悬停标签 - immich风格 */}
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

      {/* 滚动位置指示线 - immich风格，显示在右侧 */}
      {!isDragging && viewportTopMonth && (
        <div 
          className="absolute end-0 h-0.5 w-10 bg-immich-primary dark:bg-immich-dark-primary"
          style={{ top: `${scrollY - 2}px` }}
        >
          {/* 滚动时显示标签 */}
          {scrollTop > 0 && (
            <div className="absolute end-0 bottom-0 min-w-20 max-w-64 w-fit rounded-tl-md border-b-2 border-immich-primary dark:border-immich-dark-primary bg-immich-bg/90 dark:bg-immich-dark-bg/90 z-1 py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:text-immich-dark-fg pointer-events-none">
              {segments.find(s => s.year === viewportTopMonth?.year && s.month === viewportTopMonth?.month)?.dateFormatted || ''}
            </div>
          )}
        </div>
      )}

      {/* 标尺段 - immich风格，垂直标尺 */}
      <div className="relative w-full h-full">
        {/* Lead-in spacer */}
        <div
          className="relative"
          style={{ height: `${PADDING_TOP}px` }}
          data-id="lead-in"
          data-label={segments[0]?.dateFormatted}
        />

        {/* Time Segments - 标尺类型，垂直排列，每个段是一个独立的 div */}
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
            {/* 年份标签 - immich风格，显示在底部右侧 */}
            {segment.hasLabel && (
              <div className="absolute end-5 text-[12px] dark:text-immich-dark-fg font-mono bottom-0 pointer-events-none whitespace-nowrap">
                {segment.year}
              </div>
            )}

            {/* 点标记 - immich风格，显示在底部右侧 */}
            {segment.hasDot && (
              <div className="absolute end-3 bottom-0 h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-500 pointer-events-none" />
            )}
          </div>
        ))}

        {/* Lead-out spacer */}
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
