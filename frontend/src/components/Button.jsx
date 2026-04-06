import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

/**
 * Standardized Button Component
 * Features:
 * - Haptic scale animation on click
 * - Consistent rounding and padding
 * - Primary, Secondary, Outline, and Ghost variants
 */

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  leftIcon, 
  rightIcon, 
  children, 
  ...props 
}, ref) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-700 shadow-premium',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border-2 border-slate-200 bg-transparent text-slate-700 hover:border-primary hover:text-primary',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-50',
    danger: 'bg-danger text-white hover:bg-red-700 shadow-lg shadow-red-200',
  };

  const sizes = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={!shouldReduceMotion && !isLoading && !props.disabled ? { scale: 1.02 } : {}}
      whileTap={!shouldReduceMotion && !isLoading && !props.disabled ? { scale: 0.96 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={isLoading || props.disabled}
      className={cn(
        'btn gap-2 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
