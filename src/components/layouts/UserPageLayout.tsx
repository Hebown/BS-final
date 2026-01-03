'use client'

import { ReactNode, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import NavigationBar from '@/components/navigation/NavigationBar'
import UserSidebar from '@/components/sidebar/UserSidebar'
import { sidebarStore } from '@/lib/stores/sidebar'
import { mobileDevice } from '@/lib/stores/mobile-device'
import UploadPanel from '@/components/shared/UploadPanel'

interface UserPageLayoutProps {
  hideNavbar?: boolean
  showUploadButton?: boolean
  title?: string
  description?: string
  scrollbar?: boolean
  header?: ReactNode
  sidebar?: ReactNode
  buttons?: ReactNode
  children: ReactNode
}

export default function UserPageLayout({
  hideNavbar = false,
  showUploadButton = false,
  title,
  description,
  scrollbar = true,
  header,
  sidebar,
  buttons,
  children,
}: UserPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullSidebar, setIsFullSidebar] = useState(false)
  const scrollbarClass = scrollbar ? 'immich-scrollbar' : 'scrollbar-hidden'
  const hasTitleClass = title ? 'top-16 h-[calc(100%-4rem)]' : 'top-0 h-full'

  // 监听窗口大小变化
  useEffect(() => {
    const checkSidebar = () => {
      setIsFullSidebar(mobileDevice.isFullSidebar)
      // 如果在桌面端，自动关闭移动端侧边栏状态
      if (mobileDevice.isFullSidebar && sidebarOpen) {
        setSidebarOpen(false)
        sidebarStore.reset()
      }
    }

    checkSidebar()
    window.addEventListener('resize', checkSidebar)
    return () => window.removeEventListener('resize', checkSidebar)
  }, [sidebarOpen])

  // 同步 sidebarStore 状态
  useEffect(() => {
    const updateState = () => {
      setSidebarOpen(sidebarStore.isOpen)
    }
    // 初始状态
    updateState()
    // 订阅状态变化
    const unsubscribe = sidebarStore.subscribe(updateState)
    return unsubscribe
  }, [])

  const handleUploadClick = async () => {
    try {
      const { openFileUploadDialog } = await import('@/lib/utils/file-uploader')
      const { handleFileUpload } = await import('@/lib/utils/upload-handler')
      
      const files = await openFileUploadDialog({ multiple: true })
      if (files.length > 0) {
        await handleFileUpload(files)
      }
    } catch (error) {
      console.error('上传失败:', error)
    }
  }

  const toggleSidebar = () => {
    sidebarStore.toggle()
    setSidebarOpen(sidebarStore.isOpen)
  }

  // 计算侧边栏是否应该显示
  const isHidden = !sidebarOpen && !isFullSidebar
  const isExpanded = sidebarOpen && !isFullSidebar

  return (
    <>
      {/* Navigation Bar */}
      {!hideNavbar && (
        <NavigationBar
          showUploadButton={showUploadButton}
          onUploadClick={handleUploadClick}
          onMenuClick={toggleSidebar}
        />
      )}

      {/* Main Layout */}
      <div
        className={cn(
          "relative z-0 grid overflow-hidden",
          // 使用 immich 的布局逻辑：默认 0 宽度，sidebar 断点下 16rem
          "grid-cols-[0_auto] sidebar:grid-cols-[16rem_auto]",
          hideNavbar ? 'h-screen' : 'h-[calc(100vh-4rem)] max-md:h-[calc(100vh-3.5rem)]'
        )}
      >
        {/* Sidebar */}
        <aside 
          className={cn(
            "immich-scrollbar relative z-1 overflow-y-auto overflow-x-hidden pt-8 transition-all duration-200 bg-light dark:bg-immich-dark-bg",
            // 基础宽度：0（移动端隐藏），sidebar 断点下 16rem（桌面端显示）
            "w-0 sidebar:w-64",
            // 移动端展开时：显示并添加样式
            isExpanded && "w-[min(100vw,16rem)] shadow-2xl border-r dark:border-e-immich-dark-gray"
          )}
          data-testid="sidebar-parent"
          inert={isHidden}
        >
          {sidebar || <UserSidebar />}
        </aside>

        {/* Main Content */}
        <main className="relative">
          <div className={cn(
            scrollbarClass,
            "absolute",
            hasTitleClass,
            "w-full overflow-y-auto p-2"
          )}>
            {header}
            {children}
          </div>

          {/* Title Bar */}
          {title && (
            <div className="absolute flex h-16 w-full place-items-center justify-between border-b p-2 text-dark dark:text-immich-dark-fg">
              <div className="flex gap-2 items-center">
                <div className="font-medium outline-none pe-8" tabIndex={-1} id="user-page-header">
                  {title}
                </div>
                {description && (
                  <p className="text-sm text-gray-400 dark:text-gray-600">{description}</p>
                )}
              </div>
              {buttons && <div>{buttons}</div>}
            </div>
          )}
        </main>
      </div>

      {/* 上传面板 */}
      <UploadPanel />
    </>
  )
}

