'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

// 图标组件 - iOS Photos风格
const PhotosIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="6" cy="14" r="1.5" />
    <circle cx="18" cy="14" r="1.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="4" cy="12" r="1.5" />
    <circle cx="20" cy="12" r="1.5" />
    <circle cx="12" cy="16" r="2" />
  </svg>
)

const DaysIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const PeopleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

const MemoriesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
    <path d="M12 8l-3 3 3 3" />
  </svg>
)

const JourneysIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const FeaturedIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M5 3v18M3 5h4M3 12h4M3 19h4" />
    <path d="M12 3l3 3-3 3V3z" />
    <path d="M12 9l3 3-3 3V9z" />
    <path d="M12 15l3 3-3 3v-6z" />
  </svg>
)

const WallpaperIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 3v18" />
  </svg>
)

const FavoritesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const RecentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const VideosIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const ScreenshotsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

const SelfiesIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    <rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth={2} />
  </svg>
)

const PanoramaIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>
)

const SlowMotionIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <path d="M8 8l8 8M16 8l-8 8" />
  </svg>
)

const DocumentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const menuItems = [
  { id: 'photos', label: '照片', path: '/dashboard', icon: PhotosIcon },
  { id: 'days', label: '日子', path: '/dashboard/days', icon: DaysIcon },
  { id: 'people', label: '人物', path: '/dashboard/people', icon: PeopleIcon },
  { id: 'memories', label: '回忆', path: '/dashboard/memories', icon: MemoriesIcon },
  { id: 'journeys', label: '旅程', path: '/dashboard/journeys', icon: JourneysIcon },
  { id: 'featured', label: '精选照片', path: '/dashboard/featured', icon: FeaturedIcon },
  { id: 'wallpaper', label: '墙纸建议', path: '/dashboard/wallpaper', icon: WallpaperIcon },
  { id: 'collections', label: '固定精选集', path: '/dashboard/collections', hasSubmenu: true },
  { id: 'favorites', label: '个人收藏', path: '/dashboard/favorites', icon: FavoritesIcon },
  { id: 'recent', label: '最近存储', path: '/dashboard/recent', icon: RecentIcon },
  { id: 'map', label: '地图', path: '/dashboard/map', icon: MapIcon },
  { id: 'videos', label: '视频', path: '/dashboard/videos', icon: VideosIcon },
  { id: 'screenshots', label: '截屏', path: '/dashboard/screenshots', icon: ScreenshotsIcon },
  { id: 'selfies', label: '自拍', path: '/dashboard/selfies', icon: SelfiesIcon },
  { id: 'panorama', label: '全景照片', path: '/dashboard/panorama', icon: PanoramaIcon },
  { id: 'slowmotion', label: '慢动作', path: '/dashboard/slowmotion', icon: SlowMotionIcon },
  { id: 'documents', label: '文稿', path: '/dashboard/documents', icon: DocumentsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isEditing, setIsEditing] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200/40 flex flex-col h-screen">
      {/* 顶部：文件夹图标和编辑按钮 */}
      <div className="px-4 py-3.5 border-b border-gray-200/40">
        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            <FolderIcon />
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-[#007AFF] hover:text-[#0051D5] transition-colors font-medium"
          >
            {isEditing ? '完成' : '编辑'}
          </button>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isItemActive = isActive(item.path)
          const isCollections = item.id === 'collections'

          return (
            <div key={item.id}>
              {isCollections ? (
                // 固定精选集：纯文本样式，带箭头
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 font-medium">{item.label}</span>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-[#007AFF]"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                // 普通菜单项：图标 + 文字，选中状态有背景
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[10px] transition-all duration-200 ${
                    isItemActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {Icon && (
                    <span className="text-[#007AFF] shrink-0">
                      <Icon />
                    </span>
                  )}
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-200/40">
        <Link
          href="/upload"
          className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
        >
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>上传图片</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full mt-2 px-4 py-2.5 mx-2 rounded-lg text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm text-left font-medium"
        >
          退出登录
        </button>
      </div>
    </aside>
  )
}
