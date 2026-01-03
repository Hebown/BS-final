'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'
import SearchBar from '@/components/search/SearchBar'
import { Icon } from '@mdi/react'
import {
  mdiBellBadge,
  mdiBellOutline,
  mdiTrayArrowUp,
  mdiCog,
  mdiLogout,
  mdiPencil,
  mdiMenu,
  mdiMagnify,
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiTag,
} from '@mdi/js'
import Logo from '@/components/shared/Logo'

interface NavigationBarProps {
  showUploadButton?: boolean
  onUploadClick?: () => void
  onMenuClick?: () => void
  noBorder?: boolean
}

export default function NavigationBar({
  showUploadButton = true,
  onUploadClick,
  onMenuClick,
  noBorder = false,
}: NavigationBarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showAccountPanel, setShowAccountPanel] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const user = session?.user
  const hasUnreadNotifications = false // TODO: Implement notification logic

  return (
    <nav
      id="dashboard-navbar"
      className={cn(
        "h-16 w-screen text-sm",
        "max-md:h-14",
        !noBorder && "border-b border-gray-200 dark:border-immich-dark-gray"
      )}
    >
      <div className="grid h-full grid-cols-[8rem_auto] items-center py-2 sidebar:grid-cols-[16rem_auto]">
        {/* 左侧：菜单按钮和Logo */}
        <div className="flex flex-row gap-1 mx-4 items-center">
          <IconButton
            id="menu-button"
            shape="round"
            color="secondary"
            variant="ghost"
            size="medium"
            title="主菜单"
            aria-label="主菜单"
            className="sidebar:hidden"
            onClick={onMenuClick}
            icon={<Icon path={mdiMenu} size={1} />}
          />
          <Link href="/dashboard" className="flex items-center">
            <Logo 
              size={40} 
              className="max-md:w-12 max-md:h-12"
              showBackground={true}
            />
          </Link>
        </div>

        {/* 右侧：搜索、上传、通知、用户 */}
        <div className="flex justify-between gap-4 lg:gap-8 pe-6">
          {/* 搜索栏 - 桌面端 */}
          <div className="hidden w-full max-w-5xl flex-1 tall:ps-0 sm:block">
            <SearchBar grayTheme={false} />
          </div>

          <section className="flex place-items-center justify-end gap-1 md:gap-2 w-full sm:w-auto">
            {/* 搜索按钮 - 移动端 */}
            <IconButton
              color="secondary"
              shape="round"
              variant="ghost"
              size="medium"
              href="/search"
              id="search-button"
              className="sm:hidden"
              aria-label="搜索"
              title="搜索"
              icon={<Icon path={mdiMagnify} size={1} />}
            />

            {/* 上传按钮 */}
            {showUploadButton && onUploadClick && !pathname?.includes('/admin') && (
              <>
                <Button
                  onClick={onUploadClick}
                  className="hidden lg:flex"
                  variant="ghost"
                  size="medium"
                  color="secondary"
                  leadingIcon={<Icon path={mdiTrayArrowUp} size={1} />}
                >
                  上传
                </Button>
                <IconButton
                  color="secondary"
                  shape="round"
                  variant="ghost"
                  size="medium"
                  onClick={onUploadClick}
                  title="上传"
                  aria-label="上传"
                  className="lg:hidden"
                  icon={<Icon path={mdiTrayArrowUp} size={1} />}
                />
              </>
            )}

            {/* 主题切换按钮 */}
            <ThemeButton />

            {/* 通知按钮 */}
            <div className="relative">
              <IconButton
                shape="round"
                color={hasUnreadNotifications ? 'primary' : 'secondary'}
                variant="ghost"
                size="medium"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                aria-label="通知"
                title="通知"
                icon={
                  <Icon 
                    path={hasUnreadNotifications ? mdiBellBadge : mdiBellOutline} 
                    size={0.8} 
                  />
                }
              />
            </div>

            {/* 用户头像 */}
            <div className="relative">
              <button
                type="button"
                className="flex ps-2"
                onClick={() => setShowAccountPanel(!showAccountPanel)}
                title={user ? `${user.name || ''} (${user.email || ''})` : '用户'}
              >
                <UserAvatar user={user} size="md" />
              </button>

              {/* 账户信息面板 */}
              {showAccountPanel && (
                <AccountInfoPanel
                  user={user}
                  onLogout={handleLogout}
                  onClose={() => setShowAccountPanel(false)}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </nav>
  )
}

// 主题切换按钮组件
function ThemeButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // 检测系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(currentTheme)

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <IconButton
      color="secondary"
      shape="round"
      variant="ghost"
      size="medium"
      onClick={toggleTheme}
      aria-label="切换主题"
      title="切换主题"
      icon={
        <Icon 
          path={theme === 'dark' ? mdiWeatherSunny : mdiWeatherNight} 
          size={1} 
        />
      }
    />
  )
}

// 用户头像组件
function UserAvatar({ user, size = 'md' }: { user?: any; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  if (!user) {
    return (
      <div className={cn(
        sizeClasses[size],
        "rounded-full bg-immich-primary dark:bg-immich-dark-primary flex items-center justify-center"
      )}>
        <span className="text-white text-sm font-medium">?</span>
      </div>
    )
  }

  const initials = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'

  return (
    <div className={cn(
      sizeClasses[size],
      "rounded-full bg-immich-primary dark:bg-immich-dark-primary flex items-center justify-center",
      "border-2 border-immich-primary hover:border-immich-dark-primary dark:hover:border-immich-primary dark:border-immich-dark-primary transition-colors"
    )}>
      <span className="text-white text-sm font-medium">{initials}</span>
    </div>
  )
}

// 账户信息面板组件
function AccountInfoPanel({
  user,
  onLogout,
  onClose,
}: {
  user?: any
  onLogout: () => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute z-10 end-6 top-16 w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-t-3xl bg-white p-4 dark:bg-immich-dark-primary/10">
        <div className="relative">
          <UserAvatar user={user} size="lg" />
        </div>
        <div>
          <p className="text-center text-lg font-medium text-immich-primary">
            {user?.name || '用户'}
          </p>
          <p className="text-sm text-gray-500 dark:text-immich-dark-fg">{user?.email || ''}</p>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <Button
            onClick={() => {
              window.location.href = '/settings'
              onClose()
            }}
            size="small"
            color="secondary"
            variant="ghost"
            shape="round"
            className="border dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white"
            leadingIcon={<Icon path={mdiCog} size={0.8} />}
          >
            账户设置
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/tags'
              onClose()
            }}
            size="small"
            color="secondary"
            variant="ghost"
            shape="round"
            className="border dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white"
            leadingIcon={<Icon path={mdiTag} size={0.8} />}
          >
            标签管理
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col">
        <Button
          className="m-1 mx-4 rounded-none rounded-b-3xl bg-white p-3 dark:bg-immich-dark-primary/10"
          onClick={() => {
            onLogout()
            onClose()
          }}
          leadingIcon={<Icon path={mdiLogout} size={0.8} />}
          variant="ghost"
          color="secondary"
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}

