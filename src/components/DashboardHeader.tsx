'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface DashboardHeaderProps {
  title?: string
  dateRange?: string
  onSearchClick?: () => void
  onSelectClick?: () => void
}

export default function DashboardHeader({
  title = '图库',
  dateRange,
  onSearchClick,
  onSelectClick,
}: DashboardHeaderProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const { data: session } = useSession()

  const handleSelectClick = () => {
    setIsSelecting(!isSelecting)
    onSelectClick?.()
  }

  // 如果没有提供日期范围，使用当前时间计算
  const displayDateRange = dateRange || '最近'

  return (
    <header className="sticky top-0 z-10 glass-effect border-b border-gray-200/60">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧标题和日期 */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
            {displayDateRange && (
              <p className="text-sm text-gray-600 mt-0.5">
                {displayDateRange}
              </p>
            )}
          </div>

          {/* 右侧操作按钮和状态 */}
          <div className="flex items-center gap-3">
            {/* 搜索按钮 */}
            <button
              onClick={onSearchClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-sm text-gray-700 font-medium active:scale-95"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden sm:inline">Q 搜索</span>
            </button>

            {/* 选择按钮 */}
            <button
              onClick={handleSelectClick}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium active:scale-95 ${
                isSelecting
                  ? 'bg-[#007AFF] text-white hover:bg-[#0051D5] shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              选择
            </button>

            {/* 状态图标（WiFi和电池） */}
            <div className="hidden md:flex items-center gap-2 text-gray-500 px-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M9 5a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L10 7.414 7.414 10a1 1 0 01-1.414-1.414l3-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">47%</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

