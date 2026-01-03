import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      color: {
        primary: "bg-primary-50 border-primary-200 text-primary-900 dark:bg-primary-950 dark:border-primary-800 dark:text-primary-100",
        success: "bg-success-50 border-success-200 text-success-900 dark:bg-success-950 dark:border-success-800 dark:text-success-100",
        danger: "bg-danger-50 border-danger-200 text-danger-900 dark:bg-danger-950 dark:border-danger-800 dark:text-danger-100",
        warning: "bg-warning-50 border-warning-200 text-warning-900 dark:bg-warning-950 dark:border-warning-800 dark:text-warning-100",
        info: "bg-info-50 border-info-200 text-info-900 dark:bg-info-950 dark:border-info-800 dark:text-info-100",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
)

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  color?: VariantProps<typeof alertVariants>['color']
  title?: string
  closable?: boolean
  onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, color, title, closable, onClose, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(true)

    if (!isOpen) return null

    const handleClose = () => {
      setIsOpen(false)
      onClose?.()
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ color }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {title && (
              <h4 className="font-semibold mb-1">{title}</h4>
            )}
            <div>{children}</div>
          </div>
          {closable && (
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert, alertVariants }

