/**
 * 安全工具模块
 * 提供统一的权限检查和会话验证功能
 */

import { auth } from './auth'

/**
 * 获取当前会话的用户ID
 * @returns 用户ID，如果未登录则返回null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

/**
 * 验证用户是否已登录
 * @returns 如果已登录返回用户ID，否则抛出错误
 * @throws {Error} 如果用户未登录
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED: 请先登录')
  }
  return userId
}

/**
 * 验证资源所有权
 * @param resourceUserId 资源所属的用户ID
 * @param currentUserId 当前用户ID
 * @throws {Error} 如果用户无权访问该资源
 */
export function requireResourceOwnership(resourceUserId: string, currentUserId: string): void {
  if (resourceUserId !== currentUserId) {
    throw new Error('FORBIDDEN: 无权访问此资源')
  }
}

/**
 * 安全执行操作 - 自动处理认证和权限检查
 * @param operation 要执行的操作函数
 * @returns 操作结果
 */
export async function secureOperation<T>(
  operation: (userId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const userId = await requireAuth()
    const data = await operation(userId)
    return { success: true, data }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '操作失败'
    
    // 根据错误类型返回不同的错误代码
    if (errorMessage.includes('UNAUTHORIZED')) {
      return { success: false, error: '请先登录' }
    }
    if (errorMessage.includes('FORBIDDEN')) {
      return { success: false, error: '无权执行此操作' }
    }
    
    console.error('操作失败:', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * 验证资源所有权并执行操作
 * @param resourceUserId 资源所属的用户ID
 * @param operation 要执行的操作函数
 * @returns 操作结果
 */
export async function secureResourceOperation<T>(
  resourceUserId: string,
  operation: (userId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  return secureOperation(async (userId: string) => {
    requireResourceOwnership(resourceUserId, userId)
    return await operation(userId)
  })
}

