'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// 创建或更新标签
export async function createOrUpdateTag(
  name: string,
  color?: string | null
): Promise<{
  success: boolean
  data?: { id: string; name: string; color: string | null }
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

    // 检查标签是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    })

    if (existingTag) {
      // 如果存在，更新颜色（如果提供）
      if (color !== undefined) {
        const updated = await prisma.tag.update({
          where: { id: existingTag.id },
          data: { color }
        })
        revalidatePath('/dashboard')
        return {
          success: true,
          data: {
            id: updated.id,
            name: updated.name,
            color: updated.color
          }
        }
      }
      return {
        success: true,
        data: {
          id: existingTag.id,
          name: existingTag.name,
          color: existingTag.color
        }
      }
    }

    // 创建新标签
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || null
      }
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color
      }
    }
  } catch (error) {
    console.error('创建/更新标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建/更新标签失败'
    }
  }
}

// 更新标签颜色
export async function updateTagColor(
  tagId: string,
  color: string | null
): Promise<{
  success: boolean
  data?: { id: string; name: string; color: string | null }
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

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: { color }
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color
      }
    }
  } catch (error) {
    console.error('更新标签颜色失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新标签颜色失败'
    }
  }
}

// 删除标签
export async function deleteTag(tagId: string): Promise<{
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

    await prisma.tag.delete({
      where: { id: tagId }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('删除标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除标签失败'
    }
  }
}

// 获取所有标签（包括未使用的）
export async function getAllTagsIncludingUnused(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; color: string | null }>
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

    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: tags }
  } catch (error) {
    console.error('获取标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取标签失败'
    }
  }
}
