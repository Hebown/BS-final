import { getAllTagsIncludingUnused } from '@/lib/actions/tag-actions'
import { auth } from '@/lib/auth'
import TagManagementClient from '@/components/tags/TagManagementClient'

export default async function TagsPage() {
  const session = await auth()
  
  if (!session) {
    return null
  }

  const tagsResult = await getAllTagsIncludingUnused()
  const tags = tagsResult.success && tagsResult.data ? tagsResult.data : []

  return <TagManagementClient initialTags={tags} />
}


