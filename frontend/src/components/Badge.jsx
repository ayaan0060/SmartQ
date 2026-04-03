import React, { memo } from 'react';
import { cn } from '../utils/cn';

const Badge = ({ children, variant = 'neutral', className, ...props }) => {
  const variants = {
    primary: 'bg-primary-50 text-primary border-primary/20',
    success: 'bg-success-50 text-success border-success/20',
    warning: 'bg-warning-50 text-warning border-warning/20',
    danger: 'bg-red-50 text-red-600 border-red-100',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
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
