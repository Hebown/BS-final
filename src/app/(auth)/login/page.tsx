'use client';
// (auth)/login/page.tsx
import { useActionState } from 'react';
import Link from 'next/link';
import { login, LoginState } from '@/lib/actions/auth-actions';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

const initialState:LoginState={
  success:false,
  message:'',
  errors:{}
}

export default function LoginForm() {
  const [state,formAction,isPending]=useActionState(login,initialState)
  const {data:session,status}=useSession()
  if(status==="authenticated"){
    redirect('/')
  }
  return (
    <div>
      <div>
        <h2>登录账号</h2>
        <p>
            或{' '}
            <Link href="/register">
              注册新账号
            </Link>
          </p>
      </div>

      <form action={formAction}>
          <div>
            <label htmlFor="email">邮箱地址</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="邮箱地址"
            />
            {state.errors?.email&&(
              <p>{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password">密码</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="密码"
            />
            {state.errors?.password&&(
              <p>{state.errors.password[0]}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
            >
              {isPending ? '登录中...' : '登录'}
            </button>
          </div>
          {!state.errors?.password&&!state.errors?.email&&state.message && (
            <div>
              {state.message}
            </div>
          )}
        </form>
    </div>
  )
}

