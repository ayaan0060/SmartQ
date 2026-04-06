import React from 'react';

const variants = {
  primary: 'bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) rounded-lg px-4 py-2 text-sm font-semibold active:scale-95 transition-all',
  secondary: 'border border-(--border) rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all',
  ghost: 'text-sm font-medium text-(--muted) hover:text-(--foreground) hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg px-3 py-2 transition-all',
  danger: 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
