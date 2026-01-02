'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createUser, CreateUserState } from '@/lib/actions/user-actions'
import AuthPageLayout from '@/components/layouts/AuthPageLayout'
import { Alert, Button, Field, Input, PasswordInput, Stack } from '@/components/ui'

const initialState: CreateUserState = {
  success: false,
  message: '',
  errors: {},
}

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState)

  return (
    <AuthPageLayout title="注册">
      <Stack gap={4}>
      <form action={formAction} className="flex flex-col gap-4">
        {/* 显示成功消息 */}
        {state.success && state.message && (
          <Alert color="success" title={state.message} />
        )}

        {/* 显示错误消息 */}
        {state.message && !state.success && (
          <Alert color="danger" title={state.message} />
        )}

        <Field 
          label="用户名" 
          error={state.errors?.username?.[0]}
          required
        >
          <Input
            id="username"
            name="username"
            type="text"
            required
            placeholder="用户名"
            invalid={!!state.errors?.username}
          />
        </Field>

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
            autoComplete="new-password"
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
          注册
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        或{' '}
        <Link 
          href="/login"
          className="text-immich-primary dark:text-immich-dark-primary hover:opacity-80 transition-opacity font-medium"
        >
          登录已有账号
        </Link>
      </div>
    </Stack>
    </AuthPageLayout>
  )
}
