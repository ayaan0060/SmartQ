import React from 'react';
import { useAuthStore } from '../../features/auth/useAuthStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manage your account and preferences</p>
      </div>

      <div className="card p-5 max-w-lg">
        <h3 className="font-semibold text-white text-sm mb-4">Account Details</h3>
        <div className="space-y-4">
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Phone', value: user?.phone },
            { label: 'Role', value: user?.role },
            { label: 'Hospital ID', value: user?.hospitalId || 'Global Access' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</span>
              <span className="text-sm text-white capitalize">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
