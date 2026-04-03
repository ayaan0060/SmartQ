import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

/**
 * PageLayout Component
 * Provides a standardized container with smooth entry animations
 */
const PageLayout = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('container mx-auto px-4 md:px-8 max-w-7xl pt-8', className)}
    >
      {children}
    </motion.div>
  );
};

export default PageLayout;
