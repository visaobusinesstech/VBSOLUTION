import React from 'react';
import { useButtonColors } from '@/hooks/useButtonColors';

interface ButtonThemeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const ButtonTheme: React.FC<ButtonThemeProps> = ({
  variant = 'primary',
  children,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const { getButtonStyle, getHoverStyle } = useButtonColors();
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle = getButtonStyle(variant);
  const hoverStyle = isHovered ? getHoverStyle(variant) : {};

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${className}`}
      style={{
        ...baseStyle,
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
};

export default ButtonTheme;
