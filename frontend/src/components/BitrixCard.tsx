
import * as React from "react";
import { cn } from "@/lib/utils";

const BitrixCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bitrix-card",
      className
    )}
    {...props}
  />
));
BitrixCard.displayName = "BitrixCard";

const BitrixCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
BitrixCardHeader.displayName = "BitrixCardHeader";

const BitrixCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
));
BitrixCardTitle.displayName = "BitrixCardTitle";

const BitrixCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));
BitrixCardDescription.displayName = "BitrixCardDescription";

const BitrixCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
BitrixCardContent.displayName = "BitrixCardContent";

const BitrixCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
BitrixCardFooter.displayName = "BitrixCardFooter";

export { 
  BitrixCard, 
  BitrixCardHeader, 
  BitrixCardFooter, 
  BitrixCardTitle, 
  BitrixCardDescription, 
  BitrixCardContent 
};
