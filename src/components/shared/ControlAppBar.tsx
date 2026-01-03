'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@mdi/react'
import { mdiArrowLeft, mdiClose } from '@mdi/js'
import { cn } from '@/lib/utils'

interface ControlAppBarProps {
  showBackButton?: boolean
  backIcon?: string
  onClose?: () => void
  leading?: ReactNode
  children?: ReactNode
  trailing?: ReactNode
  className?: string
  forceDark?: boolean
  multiRow?: boolean
}

export default function ControlAppBar({
  showBackButton = true,
  backIcon = mdiClose,
  onClose,
  leading,
  children,
  trailing,
  className,
  forceDark = false,
  multiRow = false,
}: ControlAppBarProps) {
  const [appBarBorder, setAppBarBorder] = useState('bg-light border border-transparent')

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) {
        setAppBarBorder(
          forceDark
            ? 'border border-gray-600'
            : 'border border-gray-200 bg-gray-50 dark:border-gray-600'
        )
      } else {
        setAppBarBorder('bg-light border border-transparent')
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [forceDark])

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="absolute top-0 w-full bg-transparent">
      <nav
        className={cn(
          'grid',
          multiRow
            ? 'grid-cols-[100%] md:grid-cols-[25%_50%_25%]'
            : 'grid-cols-[10%_80%_10%] sm:grid-cols-[25%_50%_25%]',
          'justify-between lg:grid-cols-[25%_50%_25%]',
          appBarBorder,
          'mx-2 my-2 place-items-center rounded-lg p-2 max-md:p-0 transition-all',
          forceDark
            ? 'bg-immich-dark-gray text-white'
            : 'bg-subtle dark:bg-immich-dark-gray',
          className
        )}
      >
        <div className="flex place-items-center sm:gap-6 justify-self-start dark:text-immich-dark-fg">
          {showBackButton && (
            <IconButton
              aria-label="返回"
              onClick={handleClose}
              color="secondary"
              shape="round"
              variant="ghost"
              icon={<Icon path={backIcon} size={1} />}
              size="large"
            />
          )}
          {leading}
        </div>

        <div className="w-full">{children}</div>

        <div className="max-[350px]:me-0 max-[350px]:gap-0 me-4 flex place-items-center gap-1 justify-self-end">
          {trailing}
        </div>
      </nav>
    </div>
  )
}

