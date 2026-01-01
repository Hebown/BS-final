import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium outline-offset-2 transition-colors focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50",
  {
    variants: {
      variant: {
        filled: "",
        outline: "border",
        ghost: "",
      },
      color: {
        primary: "",
        secondary: "",
        success: "",
        danger: "",
        warning: "",
        info: "",
      },
      size: {
        tiny: "px-3 py-1 text-xs",
        small: "px-4 py-2 text-sm",
        medium: "px-5 py-2 text-base",
        large: "px-8 py-2.5 text-lg",
        giant: "px-10 py-3 text-xl",
      },
      shape: {
        rectangle: "rounded-none",
        "semi-round": "",
        round: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      roundedSize: {
        tiny: "rounded-lg",
        small: "rounded-lg",
        medium: "rounded-xl",
        large: "rounded-xl",
        giant: "rounded-2xl",
      },
    },
    compoundVariants: [
      // Filled variants
      {
        variant: "filled",
        color: "primary",
        class: "bg-primary text-light hover:bg-primary/80 focus-visible:outline-primary",
      },
      {
        variant: "filled",
        color: "secondary",
        class: "bg-dark text-light hover:bg-dark/80 focus-visible:outline-dark",
      },
      {
        variant: "filled",
        color: "success",
        class: "bg-success text-light hover:bg-success/80 focus-visible:outline-success",
      },
      {
        variant: "filled",
        color: "danger",
        class: "bg-danger text-light hover:bg-danger/80 focus-visible:outline-danger",
      },
      {
        variant: "filled",
        color: "warning",
        class: "bg-warning text-light hover:bg-warning/80 focus-visible:outline-warning",
      },
      {
        variant: "filled",
        color: "info",
        class: "bg-info text-light hover:bg-info/80 focus-visible:outline-info",
      },
      // Outline variants
      {
        variant: "outline",
        color: "primary",
        class: "border-primary bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "border-dark bg-light-100 text-dark hover:bg-light-200 focus-visible:outline-dark",
      },
      {
        variant: "outline",
        color: "success",
        class: "border-success bg-success/10 text-success hover:bg-success/20 focus-visible:outline-success",
      },
      {
        variant: "outline",
        color: "danger",
        class: "border-danger bg-danger/10 text-danger hover:bg-danger/20 focus-visible:outline-danger",
      },
      {
        variant: "outline",
        color: "warning",
        class: "border-warning bg-warning/10 text-warning hover:bg-warning/20 focus-visible:outline-warning",
      },
      {
        variant: "outline",
        color: "info",
        class: "border-info bg-info/10 text-info hover:bg-info/20 focus-visible:outline-info",
      },
      // Ghost variants
      {
        variant: "ghost",
        color: "primary",
        class: "text-primary hover:bg-primary-50 focus-visible:outline-primary",
      },
      {
        variant: "ghost",
        color: "secondary",
        class: "text-dark hover:bg-light-100 focus-visible:outline-dark",
      },
      {
        variant: "ghost",
        color: "success",
        class: "text-success hover:bg-success-50 focus-visible:outline-success",
      },
      {
        variant: "ghost",
        color: "danger",
        class: "text-danger hover:bg-danger-50 focus-visible:outline-danger",
      },
      {
        variant: "ghost",
        color: "warning",
        class: "text-warning hover:bg-warning-50 focus-visible:outline-warning",
      },
      {
        variant: "ghost",
        color: "info",
        class: "text-info hover:bg-info-50 focus-visible:outline-info",
      },
      // Rounded size for semi-round shape
      {
        shape: "semi-round",
        size: "tiny",
        class: "rounded-lg",
      },
      {
        shape: "semi-round",
        size: "small",
        class: "rounded-lg",
      },
      {
        shape: "semi-round",
        size: "medium",
        class: "rounded-xl",
      },
      {
        shape: "semi-round",
        size: "large",
        class: "rounded-xl",
      },
      {
        shape: "semi-round",
        size: "giant",
        class: "rounded-2xl",
      },
    ],
    defaultVariants: {
      variant: "filled",
      color: "primary",
      size: "medium",
      shape: "semi-round",
      fullWidth: false,
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      color,
      size,
      shape,
      fullWidth,
      disabled,
      loading,
      leadingIcon,
      trailingIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          buttonVariants({
            variant: variant || "filled",
            color: color || "primary",
            size: size || "medium",
            shape: shape || "semi-round",
            fullWidth,
            roundedSize: shape === "semi-round" ? (size || "medium") : undefined,
          }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span className="inline-block animate-spin mr-2">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {leadingIcon && !loading && <span className="inline-flex">{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className="inline-flex">{trailingIcon}</span>}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

