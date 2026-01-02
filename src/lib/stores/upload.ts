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
  updateItem: (id: string, partial: Partial<UploadAsset>) => void
  removeItem: (id: string) => void
  markStarted: (id: string) => void
  updateProgress: (id: string, loaded: number, total: number) => void
  track: (type: 'success' | 'error' | 'duplicate') => void
  dismissErrors: () => void
  reset: () => void
}

const calculateStats = (uploads: UploadAsset[]): UploadStats => {
  return {
    total: uploads.length,
    success: uploads.filter(u => u.state === UploadState.DONE).length,
    errors: uploads.filter(u => u.state === UploadState.ERROR).length,
    duplicates: uploads.filter(u => u.state === UploadState.DUPLICATED).length,
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
      updateStats()
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

