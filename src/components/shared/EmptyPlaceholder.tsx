'use client'

import { cn } from '@/lib/utils'

interface EmptyPlaceholderProps {
  text: string
  onClick?: () => void
  fullWidth?: boolean
  src?: string
  title?: string
  className?: string
}

export default function EmptyPlaceholder({
  text,
  onClick,
  fullWidth = false,
  src,
  title,
  className,
}: EmptyPlaceholderProps) {
  const width = fullWidth ? 'w-full' : 'w-1/2'
  const hoverClasses = onClick
    ? 'border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 cursor-pointer'
    : ''

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        width,
        className,
        "flex flex-col place-content-center place-items-center rounded-3xl bg-gray-50 p-5 dark:bg-immich-dark-gray",
        hoverClasses
      )}
    >
      {src && (
        <img src={src} alt="" width="500" draggable="false" className="mb-4" />
      )}
      {!src && (
        <div className="w-32 h-32 mb-4 flex items-center justify-center">
          <svg className="w-24 h-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      {title && (
        <h2 className="text-xl font-medium my-4 text-immich-fg dark:text-immich-dark-fg">{title}</h2>
      )}
      <p className="text-gray-500 dark:text-immich-dark-fg font-light text-center">{text}</p>
    </Component>
  )
}


