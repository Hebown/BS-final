import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva("flex w-full grow flex-col", {
  variants: {
    color: {
      primary: "bg-primary-50 dark:bg-primary-100",
      secondary: "text-dark bg-light-50 dark:bg-light-100 dark:text-white",
      success: "bg-success-50 dark:bg-success-100",
      danger: "bg-danger-100",
      warning: "bg-warning-100",
      info: "bg-info-50 dark:bg-info-100",
    },
  },
})

const cardContainerVariants = cva("flex w-full overflow-hidden shadow-sm", {
  variants: {
    shape: {
      rectangle: "",
      round: "rounded-2xl",
    },
    border: {
      true: "border",
      false: "",
    },
  },
  defaultVariants: {
    shape: "round",
    border: false,
  },
})

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof cardVariants> {
  shape?: "rectangle" | "round"
  border?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, color, shape = "round", border, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardContainerVariants({ shape, border: border ?? !color }),
          className
        )}
        {...props}
      >
        <div className={cn(cardVariants({ color: color || undefined }))}>{props.children}</div>
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { border?: boolean; padding?: boolean }
>(({ className, border, padding, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col",
        padding !== false && "p-4",
        border && "border-b",
        className
      )}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p ref={ref} className={cn("text-sm text-muted mt-1.5", className)} {...props} />
  )
})
CardDescription.displayName = "CardDescription"

const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("immich-scrollbar h-full w-full overflow-auto p-4", className)}
      {...props}
    />
  )
})
CardBody.displayName = "CardBody"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center border-t p-4", className)}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter }

