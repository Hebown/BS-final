import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      7: "gap-7",
      8: "gap-8",
    },
    wrap: {
      true: "flex-wrap",
      false: "",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
    fullHeight: {
      true: "h-full",
      false: "",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: 2,
    wrap: false,
    fullWidth: false,
    fullHeight: false,
  },
})

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, align, justify, gap, wrap, fullWidth, fullHeight, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          stackVariants({
            direction,
            align,
            justify,
            gap,
            wrap,
            fullWidth,
            fullHeight,
          }),
          className
        )}
        {...props}
      />
    )
  }
)
Stack.displayName = "Stack"

const HStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, align = "center", direction = "row", gap = 2, ...props }, ref) => {
    return (
      <Stack
        ref={ref}
        direction={direction}
        align={align}
        gap={gap}
        className={className}
        {...props}
      />
    )
  }
)
HStack.displayName = "HStack"

export { Stack, HStack, stackVariants }

