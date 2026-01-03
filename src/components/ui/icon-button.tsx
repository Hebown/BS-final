import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium outline-offset-2 transition-colors focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
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
        tiny: "w-6 h-6",
        small: "w-8 h-8",
        medium: "w-10 h-10",
        large: "w-12 h-12",
        giant: "w-14 h-14",
      },
      shape: {
        rectangle: "rounded-none",
        "semi-round": "",
        round: "rounded-full",
      },
    },
    compoundVariants: [
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
    ],
    defaultVariants: {
      variant: "ghost",
      color: "secondary",
      size: "medium",
      shape: "round",
    },
  }
)

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof iconButtonVariants> {
  icon?: string | React.ReactNode
  href?: string
  title?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, color, size, shape, icon, href, title, children, ...props }, ref) => {
    const iconContent = typeof icon === 'string' ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    ) : icon

    const content = iconContent || children

    if (href) {
      return (
        <a
          href={href}
          className={cn(iconButtonVariants({ variant, color, size, shape }), className)}
          title={title}
          {...(props as any)}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        className={cn(iconButtonVariants({ variant, color, size, shape }), className)}
        ref={ref}
        title={title}
        {...props}
      >
        {content}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }


