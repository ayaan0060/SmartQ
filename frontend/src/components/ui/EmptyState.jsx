import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4">
          <Icon size={48} className="text-(--muted) opacity-40" />
        </div>
      )}
      <h3 className="text-base font-semibold text-(--foreground) mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-(--muted) max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
