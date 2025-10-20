'use server'

import { User } from '@/generated/prisma'

export type DatabaseModel = User
export type DatabaseModelArray = User[]

export type ResponseType = 
  | DatabaseModel              // 单个模型
  | DatabaseModelArray         // 模型数组
  | { id: string }             // 只有ID（删除操作）
  | null                       // 无数据
  | boolean                    // 成功状态

export interface ActionResponse<T extends ResponseType = ResponseType> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export async function handleAction<T extends ResponseType>(
  operation: () => Promise<T>,
  successMessage: string
): Promise<ActionResponse<ResponseType>> {
  try {
    const data = await operation()
    return successResponse(data, successMessage)
  } catch (error) {
    console.error('Action Error:', error)
    return errorResponse(await getErrorMessage(error))
  }
}

export async function successResponse<T extends ResponseType>(
  data: T, 
  message: string
): Promise<ActionResponse<T>> {
  return { success: true, data, message }
}

export async function errorResponse(
  message: string, 
  errors?: Record<string, string[]>
): Promise<ActionResponse> {
  return { success: false, message, errors }
}

async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error) return error.message
  return '操作失败，请稍后重试'
}