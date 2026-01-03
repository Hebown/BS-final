import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex-1 py-2.5 bg-transparent transition outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-dark dark:disabled:bg-gray-900 dark:disabled:text-gray-200 dark:text-immich-dark-fg",
  {
    variants: {
      size: {
        tiny: "text-xs",
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        giant: "text-xl",
      },
      roundedSize: {
        tiny: "rounded-lg",
        small: "rounded-lg",
        medium: "rounded-lg",
        large: "rounded-lg",
        giant: "rounded-lg",
      },
      leadingPadding: {
        base: "pl-4",
        icon: "pl-0",
      },
      trailingPadding: {
        base: "pr-4",
        icon: "pr-0",
      },
    },
    defaultVariants: {
      size: "medium",
      roundedSize: "medium",
      leadingPadding: "base",
      trailingPadding: "base",
    },
  }
)

const inputContainerVariants = cva(
  "flex w-full items-center bg-gray-100 ring-1 ring-gray-200 focus-within:ring-primary dark:focus-within:ring-primary transition outline-none focus-within:ring-1 disabled:cursor-not-allowed dark:bg-gray-800 dark:ring-black",
  {
    variants: {
      shape: {
        rectangle: "rounded-none",
        "semi-round": "",
        round: "rounded-full",
      },
      roundedSize: {
        tiny: "rounded-lg",
        small: "rounded-lg",
        medium: "rounded-lg",
        large: "rounded-lg",
        giant: "rounded-lg",
      },
      invalid: {
        true: "focus-within:ring-danger dark:focus-within:ring-danger dark:ring-danger-300 ring-danger-300 ring-1",
        false: "",
      },
    },
    defaultVariants: {
      shape: "semi-round",
      roundedSize: "medium",
      invalid: false,
    },
  }
)

const iconContainerVariants = cva("flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      tiny: "w-6",
      small: "w-8",
      medium: "w-10",
      large: "w-12",
      giant: "w-14",
    },
  },
  defaultVariants: {
    size: "medium",
  },
})

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "required">,
    VariantProps<typeof inputVariants> {
  containerClassName?: string
  shape?: "rectangle" | "semi-round" | "round"
  invalid?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  trailingText?: string
  label?: string
  description?: string
  required?: boolean | "indicator"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      size = "medium",
      shape = "semi-round",
      invalid,
      leadingIcon,
      trailingIcon,
      trailingText,
      label,
      description,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const labelId = label ? `label-${inputId}` : undefined
    const descriptionId = description ? `description-${inputId}` : undefined

    const roundedSize =
      shape === "semi-round" ? (size as "tiny" | "small" | "medium" | "large" | "giant") : undefined

    return (
      <div className="flex w-full flex-col gap-1">
        {label && (
          <label
            id={labelId}
            htmlFor={inputId}
            className={cn(
              "font-medium",
              invalid ? "text-danger" : "text-gray-500 dark:text-gray-300"
            )}
          >
            {label}
            {required === "indicator" && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        {description && (
          <p
            id={descriptionId}
            className={cn(
              "text-sm mb-2",
              size === "tiny" || size === "small"
                ? "text-xs"
                : size === "large" || size === "giant"
                  ? "text-base"
                  : "text-sm",
              "text-muted"
            )}
          >
            {description}
          </p>
        )}
        <div
          className={cn(
            inputContainerVariants({
              shape,
              roundedSize,
              invalid,
            }),
            containerClassName
          )}
        >
          {leadingIcon && (
            <div tabIndex={-1} className={iconContainerVariants({ size })}>
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            aria-required={!!required}
            aria-invalid={invalid}
            className={cn(
              inputVariants({
                size,
                roundedSize,
                leadingPadding: leadingIcon ? "icon" : "base",
                trailingPadding: trailingIcon || trailingText ? "icon" : "base",
              }),
              className
            )}
            ref={ref}
            required={!!required}
            {...props}
          />
          {trailingText && (
            <span
              className={cn(
                trailingIcon ? "pl-4" : "px-4",
                size === "tiny" || size === "small"
                  ? "text-xs"
                  : size === "large" || size === "giant"
                    ? "text-base"
                    : "text-sm",
                "text-muted"
              )}
            >
              {trailingText}
            </span>
          )}
          {trailingIcon && (
            <div tabIndex={-1} className={iconContainerVariants({ size })}>
              {trailingIcon}
            </div>
          )}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants, inputContainerVariants }

