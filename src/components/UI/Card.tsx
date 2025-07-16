import React, { forwardRef, ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = 'default', padding = 'md', hover = false, className = '', ...props },
    ref
  ) => {
    const { theme, isDark } = useTheme();

    const getVariantStyles = () => {
      const variants = {
        default: `
        bg-white border border-gray-200
        ${isDark ? 'dark:bg-gray-800 dark:border-gray-700' : ''}
      `,
        elevated: `
        bg-white shadow-lg border border-gray-100
        ${isDark ? 'dark:bg-gray-800 dark:border-gray-700 dark:shadow-2xl' : ''}
      `,
        outlined: `
        bg-transparent border-2 border-gray-300
        ${isDark ? 'dark:border-gray-600' : ''}
      `,
        glass: `
        backdrop-blur-md bg-white/80 border border-white/20
        ${isDark ? 'dark:bg-gray-900/80 dark:border-gray-700/20' : ''}
      `,
      };
      return variants[variant];
    };

    const getPaddingStyles = () => {
      const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      };
      return paddings[padding];
    };

    const baseClasses = `
    rounded-xl transition-all duration-300
    ${hover ? 'hover:shadow-xl hover:scale-105 cursor-pointer' : ''}
  `;

    return (
      <div
        ref={ref}
        className={`
        ${baseClasses}
        ${getVariantStyles()}
        ${getPaddingStyles()}
        ${className}
      `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
