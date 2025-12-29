// app/(main)/dashboard/page.tsx
import { getImages } from '@/lib/actions/image-actions'
import ImageGrid from '@/components/ImageGrid'

export default async function DashboardPage() {
  const { success, data: images, error } = await getImages()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          图片库
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {images ? `共 ${images.length} 张图片` : '加载中...'}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">错误: {error}</p>
        </div>
      )}

      {images && images.length > 0 && <ImageGrid images={images} />}
      
      {images && images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            还没有图片，快去上传一些吧！
          </p>
        </div>
      )}
    </div>
  )
}