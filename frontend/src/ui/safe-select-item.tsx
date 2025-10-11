
import React from 'react';
import { SelectItem } from './select';

interface SafeSelectItemProps {
  value: any;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Safe wrapper around SelectItem that prevents empty string values
 */
export const SafeSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  SafeSelectItemProps
>(({ value, children, ...props }, ref) => {
  // Create a guaranteed safe value - no complex logic, just ensure it's never empty
  const safeValue = React.useMemo(() => {
    // Handle null, undefined, or empty string
    if (!value || String(value).trim() === '') {
      return `safe-item-${Date.now()}-${Math.random()}`;
    }
    return String(value);
  }, [value]);

  return (
    <SelectItem ref={ref} value={safeValue} {...props}>
      {children}
    </SelectItem>
  );
});

SafeSelectItem.displayName = "SafeSelectItem";
