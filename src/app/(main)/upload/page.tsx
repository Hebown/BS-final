'use client'

import { useActionState } from 'react'
import { uploadImage, UploadState } from '@/lib/actions/image-actions'

const initialState: UploadState = {
  success: false,
  message: '',
  errors: {}
}

export default function UploadPage() {
  const [state, formAction, isPending] = useActionState(uploadImage, initialState)

  return (
    <div>
      <h1>上传图片</h1>
      
      <form action={formAction}>
        <div>
          <label htmlFor="title">图片标题（可选）</label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="输入图片标题"
          />
          {state.errors?.title && (
            <p>{state.errors.title[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="image">选择图片</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            required
          />
          {state.errors?.image && (
            <p>{state.errors.image[0]}</p>
          )}
        </div>

        <button type="submit" disabled={isPending}>
          {isPending ? '上传中...' : '上传图片'}
        </button>
      </form>

    </div>
  )
}