'use client'

// 移动设备检测
export const mobileDevice = {
  get isFullSidebar() {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 850 // sidebar 断点
  },
}

