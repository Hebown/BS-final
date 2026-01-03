'use client'

import { create } from 'zustand'
import type { StateCreator } from 'zustand'

export enum UploadState {
  PENDING = 'pending',
  STARTED = 'started',
  DONE = 'done',
  ERROR = 'error',
  DUPLICATED = 'duplicated',
}

export interface UploadAsset {
  id: string
  file: File
  state?: UploadState
  progress?: number
  total?: number
  message?: string
  error?: Error | string
  assetId?: string
  isTrashed?: boolean
  albumId?: string
  startDate?: number
  speed?: number
  eta?: number
}

interface UploadStats {
  total: number
  success: number
  errors: number
  duplicates: number
}

interface UploadStore {
  uploads: UploadAsset[]
  stats: UploadStats
  isUploading: boolean
  isDismissible: boolean
  remainingUploads: number
  
  // Actions
  addItem: (asset: UploadAsset) => void
  addItems: (assets: UploadAsset[]) => void
  updateItem: (id: string, partial: Partial<UploadAsset>) => void
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  markStarted: (id: string) => void
  updateProgress: (id: string, loaded: number, total: number) => void
  track: (type: 'success' | 'error' | 'duplicate') => void
  dismissErrors: () => void
  reset: () => void
}

const calculateStats = (uploads: UploadAsset[]): UploadStats => {
  // 计算各种状态的数量
  const success = uploads.filter(u => u.state === UploadState.DONE).length
  const errors = uploads.filter(u => u.state === UploadState.ERROR).length
  const duplicates = uploads.filter(u => u.state === UploadState.DUPLICATED).length
  const pending = uploads.filter(u => u.state === UploadState.PENDING).length
  const started = uploads.filter(u => u.state === UploadState.STARTED).length
  
  return {
    total: uploads.length,
    success,
    errors,
    duplicates,
  }
}

const uploadStoreCreator: StateCreator<UploadStore> = (set, get) => {
  const updateStats = () => {
    const { uploads } = get()
    const stats = calculateStats(uploads)
    const isUploading = uploads.some((u: UploadAsset) => 
      u.state === UploadState.PENDING || u.state === UploadState.STARTED
    )
    const isDismissible = uploads.some((u: UploadAsset) => 
      u.state === UploadState.ERROR || u.state === UploadState.DUPLICATED
    )
    const remainingUploads = uploads.filter((u: UploadAsset) => 
      u.state === UploadState.PENDING || u.state === UploadState.STARTED
    ).length

    set({ stats, isUploading, isDismissible, remainingUploads })
  }

  return {
    uploads: [],
    stats: { total: 0, success: 0, errors: 0, duplicates: 0 },
    isUploading: false,
    isDismissible: false,
    remainingUploads: 0,

    addItem: (asset: UploadAsset) => {
      set((state: UploadStore) => {
        const uploads = [...state.uploads, { ...asset, state: UploadState.PENDING }]
        return { uploads }
      })
      updateStats()
    },
    
    // 批量添加多个文件（减少重新渲染）
    addItems: (assets: UploadAsset[]) => {
      set((state: UploadStore) => {
        const newUploads = assets.map(asset => ({ ...asset, state: UploadState.PENDING }))
        const uploads = [...state.uploads, ...newUploads]
        return { uploads }
      })
      updateStats()
    },

    updateItem: (id: string, partial: Partial<UploadAsset>) => {
      set((state: UploadStore) => {
        const uploads = state.uploads.map((u: UploadAsset) => 
          u.id === id ? { ...u, ...partial } : u
        )
        return { uploads }
      })
      updateStats()
    },

    removeItem: (id: string) => {
      set((state: UploadStore) => {
        const uploads = state.uploads.filter((u: UploadAsset) => u.id !== id)
        return { uploads }
      })
      updateStats()
    },
    
    // 批量移除多个项目（减少重新渲染）
    removeItems: (ids: string[]) => {
      set((state: UploadStore) => {
        const idsSet = new Set(ids)
        const uploads = state.uploads.filter((u: UploadAsset) => !idsSet.has(u.id))
        return { uploads }
      })
      updateStats()
    },

    markStarted: (id: string) => {
      set((state: UploadStore) => {
        const uploads = state.uploads.map((u: UploadAsset) => 
          u.id === id 
            ? { ...u, state: UploadState.STARTED, startDate: Date.now() }
            : u
        )
        return { uploads }
      })
      updateStats()
    },

    updateProgress: (id: string, loaded: number, total: number) => {
      const progress = (loaded / total) * 100
      const { uploads } = get()
      const upload = uploads.find((u: UploadAsset) => u.id === id)
      
      // 优化：只在进度变化超过 1% 时才更新，减少不必要的状态更新
      const currentProgress = upload?.progress || 0
      if (Math.abs(progress - currentProgress) < 1 && upload?.total === total) {
        return // 进度变化小于 1%，跳过更新
      }
      
      if (upload && upload.startDate) {
        const elapsed = (Date.now() - upload.startDate) / 1000
        const speed = loaded / elapsed
        const eta = Math.ceil((total - loaded) / speed)

        set((state: UploadStore) => {
          const uploads = state.uploads.map((u: UploadAsset) => 
            u.id === id 
              ? { ...u, progress, total, loaded, speed, eta }
              : u
          )
          return { uploads }
        })
      } else {
        set((state: UploadStore) => {
          const uploads = state.uploads.map((u: UploadAsset) => 
            u.id === id ? { ...u, progress, total, loaded } : u
          )
          return { uploads }
        })
      }
      // 优化：进度更新不立即更新统计，减少计算频率
      // updateStats() 会在关键状态变化时调用
    },

    track: (type: 'success' | 'error' | 'duplicate') => {
      // 统计信息已通过 updateStats 自动更新
      updateStats()
    },

    dismissErrors: () => {
      set((state: UploadStore) => {
        const uploads = state.uploads.filter((u: UploadAsset) => 
          u.state !== UploadState.ERROR && u.state !== UploadState.DUPLICATED
        )
        return { uploads }
      })
      updateStats()
    },

    reset: () => {
      set({
        uploads: [],
        stats: { total: 0, success: 0, errors: 0, duplicates: 0 },
        isUploading: false,
        isDismissible: false,
        remainingUploads: 0,
      })
    },
  }
}

export const useUploadStore = create<UploadStore>(uploadStoreCreator)

