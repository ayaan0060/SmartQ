import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-white/10 rounded ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-(--card) rounded-xl border border-(--border) p-5 md:p-6 space-y-3">
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-8 w-1/2 rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-(--border)">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3 rounded" />
        <Skeleton className="h-3 w-1/5 rounded" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div>
      <div className="flex gap-4 px-4 py-3 border-b border-(--border)">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-3 flex-1 rounded" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
