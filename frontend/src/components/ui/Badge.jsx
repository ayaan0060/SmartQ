import React from 'react';

const styles = {
  waiting:   'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  active:    'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  emergency: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info:      'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  default:   'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
};

export default function Badge({ variant = 'default', dot = false, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant] || styles.default} ${className}`}>
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${variant === 'active' ? 'bg-green-500 animate-pulse' : variant === 'emergency' ? 'bg-red-500 animate-pulse' : 'bg-current opacity-50'}`} />
      )}
      {children}
    </span>
  );
}
