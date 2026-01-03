import { Icon } from '@mdi/react'
import { mdiLoading } from '@mdi/js'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-immich-bg dark:bg-immich-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Icon 
            path={mdiLoading} 
            size="64px" 
            className="text-primary animate-spin"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
            加载中...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            正在加载您的图片
          </p>
        </div>
      </div>
    </div>
  )
}

