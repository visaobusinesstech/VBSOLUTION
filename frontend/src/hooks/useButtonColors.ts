import { useTheme } from '@/contexts/ThemeContext';

export const useButtonColors = () => {
  const { buttonColor } = useTheme();

  const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => {
    const baseStyle = {
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: 'var(--button-color)',
          color: '#ffffff',
          border: `1px solid var(--button-color)`,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: 'var(--button-color)',
          border: `1px solid var(--button-color)`,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: '1px solid #ef4444',
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#10b981',
          color: '#ffffff',
          border: '1px solid #10b981',
        };
      default:
        return baseStyle;
    }
  };

  const getHoverStyle = (variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => {
    switch (variant) {
      case 'primary':
        return {
          opacity: 0.9,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--button-color)',
          color: '#ffffff',
        };
      case 'danger':
        return {
          opacity: 0.9,
          backgroundColor: '#dc2626',
        };
      case 'success':
        return {
          opacity: 0.9,
          backgroundColor: '#059669',
        };
      default:
        return {};
    }
  };

  return {
    buttonColor,
    getButtonStyle,
    getHoverStyle,
  };
};
