import React, { useId } from 'react';
import { cn } from '../utils/cn';

const Input = React.forwardRef(({ className, label, error, helperText, leftIcon, rightIcon, id: externalId, ...props }, ref) => {
  const generatedId = useId();
  const id = externalId || generatedId;
  const feedbackId = `${id}-feedback`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-4 flex shrink-0 items-center justify-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error || helperText ? feedbackId : undefined}
          className={cn(
            'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all placeholder:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            error && 'border-danger focus-visible:ring-danger/20 focus-visible:border-danger',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 flex shrink-0 items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p id={feedbackId} aria-live="polite" className={cn(
          'text-xs font-medium',
          error ? 'text-danger' : 'text-slate-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
