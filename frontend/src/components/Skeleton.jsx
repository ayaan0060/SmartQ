import React from 'react';
import { cn } from '../utils/cn';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Skeleton;
