'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// 为图片添加标签
export async function addTagsToImage(
  imageId: string,
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 验证图片属于当前用户
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true }
    })

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权操作此图片'
      }
    }

    // 为图片添加标签（使用 createMany 的 skipDuplicates 选项）
    await prisma.imageTag.createMany({
      data: tagIds.map(tagId => ({
        imageId,
        tagId
      })),
      skipDuplicates: true
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('添加标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '添加标签失败'
    }
  }
}

// 从图片移除标签
export async function removeTagsFromImage(
  imageId: string,
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 验证图片属于当前用户
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true }
    })

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权操作此图片'
      }
    }

    // 删除图片标签关联
    await prisma.imageTag.deleteMany({
      where: {
        imageId,
        tagId: {
          in: tagIds
        }
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('移除标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '移除标签失败'
    }
  }
}

// 设置图片的标签（替换所有现有标签）
export async function setImageTags(
  imageId: string,
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 验证图片属于当前用户
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true }
    })

    if (!image) {
      return {
        success: false,
        error: '图片不存在'
      }
    }

    if (image.userId !== session.user.id) {
      return {
        success: false,
        error: '无权操作此图片'
      }
    }

    // 先删除所有现有标签
    await prisma.imageTag.deleteMany({
      where: { imageId }
    })

    // 然后添加新标签
    if (tagIds.length > 0) {
      await prisma.imageTag.createMany({
        data: tagIds.map(tagId => ({
          imageId,
          tagId
        }))
      })
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('设置标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '设置标签失败'
    }
  }
}


