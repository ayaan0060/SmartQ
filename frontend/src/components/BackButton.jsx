import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Global BackButton — uses navigate(-1) with /home as fallback.
 * Works even after page refresh (history.length check).
 */
export default function BackButton({ className = '', style = {} }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // If user landed directly on this page (no SPA navigation history), go home.
    // document.referrer is empty when opened fresh / from outside the app.
    if (document.referrer && document.referrer.includes(window.location.host)) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#9CA3AF',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
        e.currentTarget.style.color = '#3B82F6';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = '#9CA3AF';
      }}
    >
      <ChevronLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>Back</span>
    </button>
  );
}
