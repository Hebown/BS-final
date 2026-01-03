'use client'

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Icon } from "@mdi/react"
import { mdiClose } from "@mdi/js"
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "./card"
import { IconButton } from "./icon-button"

export type ModalSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant' | 'full'

const modalStyles = cva(
  "bg-light dark:bg-subtle border-subtle shadow-primary/20 flex rounded-none border shadow-sm sm:rounded-2xl dark:border-white/10",
  {
    variants: {
      size: {
        tiny: 'h-full sm:h-min md:max-w-sm',
        small: 'h-full sm:h-min md:max-w-md',
        medium: 'h-full sm:h-min md:max-w-[--breakpoint-sm]',
        large: 'h-full sm:h-min md:max-w-[--breakpoint-md]',
        giant: 'h-full sm:h-min md:max-w-[--breakpoint-lg]',
        full: 'h-full w-full',
      },
    },
  }
)

const modalContentStyles = cva(
  "z-50 fixed inset-0 m-auto flex max-h-dvh grow sm:p-4",
  {
    variants: {
      size: {
        tiny: 'sm:h-min md:max-w-sm',
        small: 'sm:h-min md:max-w-md',
        medium: 'sm:h-min md:max-w-[--breakpoint-sm]',
        large: 'sm:h-min md:max-w-[--breakpoint-md]',
        giant: 'sm:h-min md:max-w-[--breakpoint-lg]',
        full: '',
      },
    },
  }
)

export interface ModalProps {
  title?: string
  icon?: string | boolean
  size?: ModalSize
  className?: string
  closeOnEsc?: boolean
  closeOnBackdropClick?: boolean
  children: React.ReactNode
  onClose?: () => void
  onEscapeKeydown?: (event: KeyboardEvent) => void
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    size = 'medium',
    onClose,
    onEscapeKeydown,
    icon = true,
    title,
    className,
    closeOnEsc = true,
    closeOnBackdropClick = false,
    children,
    ...props
  }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!closeOnEsc) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (onEscapeKeydown) {
            onEscapeKeydown(e)
          }
          onClose?.()
        }
      }

      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }, [closeOnEsc, onClose, onEscapeKeydown])

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose?.()
      }
    }

    const headerChildren = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === ModalHeader
    )
    const bodyChildren = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === ModalBody
    )
    const footerChildren = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === ModalFooter
    )

    return (
      <>
        <div
          className="z-40 fixed start-0 top-0 flex h-dvh max-h-dvh w-screen bg-black/30"
          onClick={handleBackdropClick}
        />
        <div
          ref={ref}
          className={cn(modalContentStyles({ size }))}
          {...props}
        >
          <div className="flex w-full grow flex-col justify-center">
            <Card
              ref={cardRef}
              className={cn(modalStyles({ size }), className)}
              shape="round"
              border={true}
            >
              <CardHeader border padding className="border-b border-gray-200 px-5 py-3 dark:border-white/10">
                {headerChildren ? (
                  headerChildren
                ) : title ? (
                  <div className="flex items-center justify-between gap-2">
                    {typeof icon === 'string' && (
                      <Icon path={icon} size="1.5rem" className="text-primary" aria-hidden />
                    )}
                    <CardTitle tag="p" className="text-dark/90 grow text-lg font-semibold">
                      {title}
                    </CardTitle>
                    <IconButton
                      icon={<Icon path={mdiClose} size={1} />}
                      variant="ghost"
                      size="small"
                      onClick={() => onClose?.()}
                      className="-me-2"
                      aria-label="关闭"
                    />
                  </div>
                ) : null}
              </CardHeader>

              <CardBody className="grow px-5">
                {bodyChildren}
              </CardBody>

              {footerChildren && (
                <CardFooter className="border-t border-gray-200 dark:border-white/10">
                  {footerChildren}
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </>
    )
  }
)
Modal.displayName = "Modal"

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-between gap-2", className)} {...props}>
        {children}
      </div>
    )
  }
)
ModalHeader.displayName = "ModalHeader"

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    )
  }
)
ModalBody.displayName = "ModalBody"

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        {children}
      </div>
    )
  }
)
ModalFooter.displayName = "ModalFooter"

