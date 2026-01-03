import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, description, required, error, children, ...props }, ref) => {
    const fieldId = React.useId()
    const labelId = label ? `label-${fieldId}` : undefined
    const descriptionId = description ? `description-${fieldId}` : undefined
    const errorId = error ? `error-${fieldId}` : undefined

    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        {label && (
          <label
            id={labelId}
            htmlFor={fieldId}
            className={cn(
              "font-medium text-sm",
              error
                ? "text-danger"
                : "text-gray-500 dark:text-gray-300"
            )}
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {description}
          </p>
        )}
        <div>
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                id: fieldId,
                "aria-labelledby": labelId,
                "aria-describedby": descriptionId || errorId,
                "aria-invalid": !!error,
                "aria-errormessage": errorId,
              } as any)
            : children}
        </div>
        {error && (
          <p
            id={errorId}
            className="text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Field.displayName = "Field"

export { Field }

