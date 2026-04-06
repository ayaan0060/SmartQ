import React from 'react';

export default function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div
      className={`bg-(--card) rounded-xl border border-(--border) p-5 md:p-6 ${interactive ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
