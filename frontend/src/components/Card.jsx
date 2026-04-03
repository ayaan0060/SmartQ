import React, { forwardRef } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

const Card = forwardRef(({ className, children, padding = 'md', hoverable = false, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <Motion.div 
      ref={ref}
      className={cn(
        'card',
        hoverable && 'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 cursor-pointer focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none focus:outline-none',
        paddings[padding],
        className
      )}
      whileHover={hoverable && !shouldReduceMotion ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </Motion.div>
  );
});

Card.displayName = 'Card';

export default Card;
