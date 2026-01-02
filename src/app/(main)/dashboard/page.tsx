// app/(main)/dashboard/page.tsx
import { getImages } from '@/lib/actions/image-actions'
import { auth } from '@/lib/auth'
import ImageGallery from '@/components/ImageGallery'
import EmptyPlaceholder from '@/components/shared/EmptyPlaceholder'

export default async function DashboardPage() {
  const session = await auth()
  
  // 如果未登录，返回null（由layout处理显示）
  if (!session) {
    return null
  }

  const { success, data: images, error } = await getImages()

  return (
    <>
      {error && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">错误: {error}</p>
        </div>
      )}

      {images && images.length > 0 && <ImageGallery images={images} />}
      
      {images && images.length === 0 && !error && (
        <EmptyPlaceholder
          text="还没有图片，快去上传一些吧！"
          className="mt-10 mx-auto"
        />
      )}
    </>
  )
}