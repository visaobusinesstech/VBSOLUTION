import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-black/5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-black/5",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm shadow-black/5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm shadow-black/5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Professional variants
        primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 border border-blue-600/20",
        success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md shadow-green-500/25 border border-green-600/20",
        warning: "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 shadow-md shadow-yellow-500/25 border border-yellow-600/20",
        danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/25 border border-red-600/20",
        info: "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-700 hover:to-cyan-800 shadow-md shadow-cyan-500/25 border border-cyan-600/20",
        // Professional outline variants
        "outline-primary": "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm",
        "outline-success": "border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-sm",
        "outline-warning": "border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 shadow-sm",
        "outline-danger": "border-2 border-red-600 text-red-600 hover:bg-red-50 shadow-sm",
        "outline-info": "border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        // Professional sizes
        "sm-professional": "h-8 px-3 py-1.5 text-xs font-medium rounded-md",
        "md-professional": "h-10 px-4 py-2 text-sm font-medium rounded-md",
        "lg-professional": "h-12 px-6 py-3 text-base font-medium rounded-lg",
        "xl-professional": "h-14 px-8 py-4 text-lg font-semibold rounded-xl",
        // Compact size for activity filters - reduced padding for tighter fit
        compact: "h-6 px-2 py-0.5 text-sm font-medium rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
