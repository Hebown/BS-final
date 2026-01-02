'use client'

import { mobileDevice } from './mobile-device'

// 侧边栏状态管理（模仿 immich 的实现）
class SidebarStore {
  private isOpenState = false
  private listeners: Set<() => void> = new Set()

  get isOpen() {
    // 如果在桌面端（>= 850px），侧边栏始终打开
    if (typeof window !== 'undefined' && mobileDevice.isFullSidebar) {
      return true
    }
    return this.isOpenState
  }

  toggle() {
    // 如果在桌面端，侧边栏始终打开，不需要切换
    if (typeof window !== 'undefined' && mobileDevice.isFullSidebar) {
      return
    }
    this.isOpenState = !this.isOpenState
    this.notifyListeners()
  }

  open() {
    this.isOpenState = true
    this.notifyListeners()
  }

  close() {
    this.isOpenState = false
    this.notifyListeners()
  }

  reset() {
    // 重置为默认状态（桌面端打开，移动端关闭）
    if (typeof window !== 'undefined' && mobileDevice.isFullSidebar) {
      this.isOpenState = true
    } else {
      this.isOpenState = false
    }
    this.notifyListeners()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

export const sidebarStore = new SidebarStore()

