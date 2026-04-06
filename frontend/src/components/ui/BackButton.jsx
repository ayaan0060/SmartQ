import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-sm text-(--muted) hover:text-(--foreground) mb-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-all"
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}
