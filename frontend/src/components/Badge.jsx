import React, { memo } from 'react';
import { cn } from '../utils/cn';

const Badge = ({ children, variant = 'neutral', className, ...props }) => {
  const variants = {
    primary: 'bg-primary-fixed text-primary border-primary/20',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error:   'bg-error-container text-on-error-container border-error/20',
    danger:  'bg-error-container text-on-error-container border-error/20',
    neutral: 'bg-surface-container text-secondary border-outline-variant/30',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default memo(Badge);
