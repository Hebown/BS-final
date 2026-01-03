/**
 * Action-Store Bridge
 * 
 * 这个文件提供了一个桥接层，用于在 Server Actions 和 Client Stores 之间进行平滑过渡。
 * 
 * 设计思路：
 * 1. Server Actions 负责数据获取和修改（服务端逻辑）
 * 2. Client Stores 负责客户端状态管理（UI状态、临时数据）
 * 3. Bridge 层提供统一的接口，让两者协同工作
 * 
 * 使用场景：
 * - 上传功能：Store 管理上传状态，Action 执行实际上传
 * - 图片获取：Action 从服务器获取，Store 缓存客户端状态
 * - 搜索功能：Store 管理搜索状态，Action 执行搜索查询
 */

'use client'

import { useRouter } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * 桥接函数：在 Server Action 和 Client Store 之间同步数据
 * 
 * @param action - Server Action 函数
 * @param store - Client Store 的更新函数
 * @param options - 配置选项
 */
export async function bridgeActionToStore<T>(
  action: () => Promise<T>,
  store?: (data: T) => void,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    revalidate?: string[]
  }
): Promise<T> {
  try {
    const result = await action()
    
    // 如果提供了 store，更新 store
    if (store && result) {
      store(result)
    }
    
    // 如果提供了 revalidate 路径，刷新路由
    if (options?.revalidate && typeof window !== 'undefined') {
      const router = useRouter()
      options.revalidate.forEach(path => {
        router.refresh()
      })
    }
    
    // 调用成功回调
    if (options?.onSuccess) {
      options.onSuccess(result)
    }
    
    return result
  } catch (error) {
    // 调用错误回调
    if (options?.onError) {
      options.onError(error instanceof Error ? error : new Error('Unknown error'))
    }
    throw error
  }
}

/**
 * 桥接函数：从 Store 获取状态，通过 Action 执行操作
 * 
 * @param storeGetter - 从 Store 获取数据的函数
 * @param action - Server Action 函数
 * @param options - 配置选项
 */
export async function bridgeStoreToAction<TData, TResult>(
  storeGetter: () => TData,
  action: (data: TData) => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult) => void
    onError?: (error: Error) => void
    validate?: (data: TData) => boolean
  }
): Promise<TResult> {
  const data = storeGetter()
  
  // 如果提供了验证函数，先验证数据
  if (options?.validate && !options.validate(data)) {
    throw new Error('Validation failed')
  }
  
  try {
    const result = await action(data)
    
    // 调用成功回调
    if (options?.onSuccess) {
      options.onSuccess(result)
    }
    
    return result
  } catch (error) {
    // 调用错误回调
    if (options?.onError) {
      options.onError(error instanceof Error ? error : new Error('Unknown error'))
    }
    throw error
  }
}

/**
 * 统一的刷新函数：结合 Server Action 的 revalidatePath 和 Client 的路由刷新
 */
export function refreshData(paths: string[] = ['/dashboard']) {
  if (typeof window !== 'undefined') {
    // 客户端：触发路由刷新
    window.dispatchEvent(new CustomEvent('data-refresh', { detail: { paths } }))
  }
}

/**
 * 监听数据刷新事件
 */
export function useDataRefresh(callback: (paths: string[]) => void) {
  if (typeof window !== 'undefined') {
    const handler = (event: CustomEvent<{ paths: string[] }>) => {
      callback(event.detail.paths)
    }
    
    window.addEventListener('data-refresh', handler as EventListener)
    
    return () => {
      window.removeEventListener('data-refresh', handler as EventListener)
    }
  }
  
  return () => {}
}

