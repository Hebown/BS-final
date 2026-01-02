// app/(main)/dashboard/page.tsx
import { getImages } from '@/lib/actions/image-actions'
import { auth } from '@/lib/auth'
import EmptyPlaceholder from '@/components/shared/EmptyPlaceholder'
import TimelineClient from '@/components/timeline/TimelineClient'

export default async function DashboardPage() {
  const session = await auth()
  
  // 如果未登录，返回null（由layout处理显示）
  if (!session) {
    return null
  }

  const { success, data: images } = await getImages()

  if (images && images.length > 0) {
    return <TimelineClient images={images} />
  }
  
  return (
    <EmptyPlaceholder
      text="还没有图片，快去上传一些吧！"
      className="mt-10 mx-auto"
    />
  )
}