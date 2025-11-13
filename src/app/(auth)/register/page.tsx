'use client'
// (auth)/register/page.tsx
import { useActionState } from "react";
import Link from "next/link";
import { createUser,CreateUserState } from "@/lib/actions/user-actions";

const initialState:CreateUserState={
    success:false,
    message:'',
    errors:{},
}

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState);

  return (
    <div>
      <div>
        <h2>注册账号</h2>
        <p>
          或{' '}
          <Link href="/login">登录已有账号</Link>
        </p>
      </div>
      
      <form action={formAction}>
        <div>
          <label htmlFor="username">用户名</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder="用户名"
          />
          {state.errors?.username && (
            <p>{state.errors.username[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email">邮箱地址</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="邮箱地址"
          />
          {state.errors?.email && (
            <p>{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password">密码</label>
          <input 
            id="password"
            name="password"
            type="text"
            required
            placeholder="密码"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
          >
            {isPending ? '注册中...' : '注册'}
          </button>
        </div>

        {state.message && (
          <div>
            {state.message}
          </div>
        )}
      </form>
    </div>
  );
}