'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@mdi/react'
import {
  mdiImageMultiple,
  mdiImageMultipleOutline,
  mdiMap,
  mdiMapOutline,
  mdiAccount,
  mdiAccountOutline,
  mdiAccountMultiple,
  mdiAccountMultipleOutline,
  mdiHeart,
  mdiHeartOutline,
  mdiImageAlbum,
  mdiToolbox,
  mdiToolboxOutline,
  mdiArchiveArrowDown,
  mdiArchiveArrowDownOutline,
  mdiChevronDown,
  mdiChevronLeft,
} from '@mdi/js'

interface SidebarLinkProps {
  title: string
  href: string
  icon: React.ReactNode | string // 支持 ReactNode 或 mdi 图标路径
  isSelected?: boolean
  flippedLogo?: boolean
  dropdownOpen?: boolean
  onDropdownToggle?: () => void
  dropdownContent?: React.ReactNode
}

function SidebarLink({
  title,
  href,
  icon,
  isSelected = false,
  flippedLogo = false,
  dropdownOpen = false,
  onDropdownToggle,
  dropdownContent,
}: SidebarLinkProps) {
  return (
    <div className="relative">
      {dropdownContent && (
        <span className="hidden md:block absolute start-1 h-full">
          <button
            type="button"
            aria-label="展开"
            className="relative flex cursor-default pt-4 pb-4 select-none justify-center hover:cursor-pointer hover:bg-subtle hover:fill-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary rounded h-fill"
            onClick={onDropdownToggle}
          >
            <Icon
              path={dropdownOpen ? mdiChevronDown : mdiChevronLeft}
              size={1}
              className={cn(
                "shrink-0 delay-100 duration-100",
                flippedLogo && "scale-x-[-1]"
              )}
            />
          </button>
        </span>
      )}
      <Link
        href={href}
        className={cn(
          "flex w-full place-items-center gap-4 rounded-e-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-subtle hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary",
          isSelected && "bg-immich-primary/10 dark:text-primary text-primary hover:bg-immich-primary/10 dark:bg-immich-dark-primary/10"
        )}
        aria-current={isSelected ? 'page' : undefined}
      >
        <div className="flex w-full place-items-center gap-4 ps-5 overflow-hidden truncate">
          {typeof icon === 'string' ? (
            <Icon
              path={icon}
              size={1.5}
              className="shrink-0"
              style={{ transform: flippedLogo ? 'scaleX(-1)' : undefined }}
            />
          ) : (
            <span className="shrink-0 text-[1.5em]" style={{ transform: flippedLogo ? 'scaleX(-1)' : undefined }}>
              {icon}
            </span>
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div></div>
      </Link>
      {dropdownContent && dropdownOpen && (
        <div className="hidden md:block">
          {dropdownContent}
        </div>
      )}
    </div>
  )
}


export default function UserSidebar() {
  const pathname = usePathname()
  const [recentAlbumsOpen, setRecentAlbumsOpen] = useState(false)

  const isSelected = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav
      id="sidebar"
      aria-label="主侧边栏"
      className="immich-scrollbar relative z-1 w-full overflow-y-auto overflow-x-hidden pt-8 transition-all duration-200 bg-light dark:bg-immich-dark-bg"
    >
      <div className="pe-6 flex flex-col gap-1 h-max min-h-full">
        <SidebarLink
          title="照片"
          href="/dashboard"
          icon={isSelected('/dashboard') ? mdiImageMultiple : mdiImageMultipleOutline}
          isSelected={isSelected('/dashboard')}
        />

        <SidebarLink
          title="地图"
          href="/map"
          icon={isSelected('/map') ? mdiMap : mdiMapOutline}
          isSelected={isSelected('/map')}
        />

        <SidebarLink
          title="人物"
          href="/people"
          icon={isSelected('/people') ? mdiAccount : mdiAccountOutline}
          isSelected={isSelected('/people')}
        />

        <SidebarLink
          title="共享"
          href="/sharing"
          icon={isSelected('/sharing') ? mdiAccountMultiple : mdiAccountMultipleOutline}
          isSelected={isSelected('/sharing')}
        />

        <p className="text-xs p-6 dark:text-immich-dark-fg uppercase">图库</p>

        <SidebarLink
          title="收藏"
          href="/favorites"
          icon={isSelected('/favorites') ? mdiHeart : mdiHeartOutline}
          isSelected={isSelected('/favorites')}
        />

        <SidebarLink
          title="相册"
          href="/albums"
          icon={mdiImageAlbum}
          flippedLogo
          dropdownOpen={recentAlbumsOpen}
          onDropdownToggle={() => setRecentAlbumsOpen(!recentAlbumsOpen)}
          dropdownContent={
            <div className="ps-8">
              {/* TODO: 实现最近相册列表 */}
              <p className="text-sm text-gray-500 dark:text-gray-400">最近相册</p>
            </div>
          }
        />

        <SidebarLink
          title="工具"
          href="/utilities"
          icon={isSelected('/utilities') ? mdiToolbox : mdiToolboxOutline}
          isSelected={isSelected('/utilities')}
        />

        <SidebarLink
          title="归档"
          href="/archive"
          icon={isSelected('/archive') ? mdiArchiveArrowDown : mdiArchiveArrowDownOutline}
          isSelected={isSelected('/archive')}
        />

        {/* 底部信息 */}
        <div className="mt-auto pb-4">
          {/* TODO: 实现底部信息组件 */}
        </div>
      </div>
    </nav>
  )
}


