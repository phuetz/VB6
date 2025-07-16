import React, { forwardRef, ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    const getVariantStyles = () => {
      const variants = {
        primary: `
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700 
        text-white 
        shadow-lg hover:shadow-xl
        border border-blue-600
      `,
        secondary: `
        bg-gray-100 hover:bg-gray-200 
        text-gray-900 
        border border-gray-300 hover:border-gray-400
      `,
        ghost: `
        bg-transparent hover:bg-gray-100 
        text-gray-700 hover:text-gray-900
        border border-transparent
      `,
        outline: `
        bg-transparent hover:bg-blue-50 
        text-blue-600 hover:text-blue-700
        border border-blue-600 hover:border-blue-700
      `,
        danger: `
        bg-gradient-to-r from-red-500 to-red-600 
        hover:from-red-600 hover:to-red-700 
        text-white 
        shadow-lg hover:shadow-xl
        border border-red-600
      `,
      };
      return variants[variant];
    };

    const getSizeStyles = () => {
      const sizes = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
      };
      return sizes[size];
    };

    const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-105 active:scale-95
  `;

    const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`
        ${baseClasses}
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${roundedClass}
        ${widthClass}
        ${className}
      `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className={`flex items-center space-x-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>

        {/* Ripple effect container */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200" />
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
