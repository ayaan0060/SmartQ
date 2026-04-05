import React from 'react';
import { cn } from '../utils/cn';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface-container',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Skeleton;
