import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ className = '' }) {
  return (
    <footer className={`w-full py-4 px-8 border-t border-zinc-200/10 bg-zinc-100 dark:bg-zinc-950 flex flex-row justify-between items-center ${className}`}>
      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
        © {new Date().getFullYear()} SmartQ Hospital Systems. HIPAA Compliant Interface.
      </p>
      <div className="flex gap-6">
        {['Privacy Policy', 'Compliance Audit', 'System Status'].map(label => (
          <a key={label} href="#" className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-red-500 transition-colors">
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
