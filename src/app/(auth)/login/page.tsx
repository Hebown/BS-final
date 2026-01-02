'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, LoginState } from '@/lib/actions/auth-actions'
import { useSession } from 'next-auth/react'
import AuthPageLayout from '@/components/layouts/AuthPageLayout'
import { Alert, Button, Field, Input, PasswordInput, Stack } from '@/components/ui'

const initialState: LoginState = {
  success: false,
  message: '',
  errors: {}
}

export default function LoginForm() {
  const router = useRouter()
  const { status, update } = useSession()
  const [state, formAction, isPending] = useActionState(login, initialState)

  // 当登录成功时，更新 session 并重定向
  useEffect(() => {
    if (state.success) {
      // 更新 session 以确保客户端状态同步
      update().then(() => {
        // 使用 replace 避免在历史记录中留下登录页
        router.replace('/dashboard')
      })
    }
  }, [state.success, router, update])

  if (status === 'loading') {
    return (
      <AuthPageLayout title="登录">
        <div className="text-center">
          <p className="text-immich-fg dark:text-immich-dark-fg">加载中...</p>
        </div>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout title="登录">
      <Stack gap={4}>
      <form action={formAction} className="flex flex-col gap-4">
        {/* 显示错误消息 */}
        {state.message && !state.errors?.email && !state.errors?.password && (
          <Alert color="danger" title={state.message} />
        )}

        <Field 
          label="邮箱地址" 
          error={state.errors?.email?.[0]}
          required
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="邮箱地址"
            invalid={!!state.errors?.email}
          />
        </Field>

        <Field 
          label="密码" 
          error={state.errors?.password?.[0]}
          required
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="密码"
            invalid={!!state.errors?.password}
          />
        </Field>

        <Button
          type="submit"
          size="large"
          shape="round"
          fullWidth
          loading={isPending}
          className="mt-6"
        >
          登录
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        或{' '}
        <Link 
          href="/register"
          className="text-immich-primary dark:text-immich-dark-primary hover:opacity-80 transition-opacity font-medium"
        >
          注册新账号
        </Link>
      </div>
      </Stack>
    </AuthPageLayout>
  )
}
