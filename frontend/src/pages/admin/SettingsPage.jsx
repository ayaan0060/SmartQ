import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { Clock, Save } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [inactivityMinutes, setInactivityMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.hospitalId) return;
    api.get(`/hospitals/${user.hospitalId}`)
      .then(r => {
        const val = r.data.data?.hospital?.settings?.doctorInactivityMinutes;
        if (val) setInactivityMinutes(val);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.hospitalId]);

  const handleSave = async () => {
    if (!user?.hospitalId) return;
    setSaving(true);
    try {
      await api.patch(`/hospitals/${user.hospitalId}/settings`, { doctorInactivityMinutes: inactivityMinutes });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manage your account and preferences</p>
      </div>

      {/* Account Details */}
      <div className="card p-5 max-w-lg">
        <h3 className="font-semibold text-white text-sm mb-4">Account Details</h3>
        <div className="space-y-4">
          {[
            { label: 'Name',       value: user?.name },
            { label: 'Email',      value: user?.email },
            { label: 'Phone',      value: user?.phone },
            { label: 'Role',       value: user?.role },
            { label: 'Hospital ID', value: user?.hospitalId || 'Global Access' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</span>
              <span className="text-sm text-white capitalize">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Settings — only for hospital-admin */}
      {user?.role === 'hospital-admin' && loaded && (
        <div className="card p-5 max-w-lg">
          <h3 className="font-semibold text-white text-sm mb-1">Doctor Availability Settings</h3>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
            Configure when doctors are automatically marked unavailable
          </p>

          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <Clock size={16} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Inactivity Timeout</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Mark doctor unavailable after no activity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={5} max={240} value={inactivityMinutes}
                  onChange={e => setInactivityMinutes(parseInt(e.target.value) || 30)}
                  className="w-24 rounded-xl px-3 py-2 text-sm text-white text-center font-bold outline-none"
                  style={{ background: '#1E293B', border: '1px solid #334155' }}
                />
                <span className="text-sm" style={{ color: '#94A3B8' }}>minutes</span>
                <div className="flex gap-2 ml-2">
                  {[15, 30, 60].map(v => (
                    <button key={v} onClick={() => setInactivityMinutes(v)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        background: inactivityMinutes === v ? '#2563EB' : '#1E293B',
                        color: inactivityMinutes === v ? '#fff' : '#6B7280',
                      }}>
                      {v}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
              <p className="text-xs font-semibold text-white mb-2">Other auto-unavailable triggers</p>
              <div className="space-y-2">
                {[
                  'Doctor logs out of the portal',
                  'Doctor\'s shift end time is reached (based on schedule)',
                  `No activity for ${inactivityMinutes} minutes`,
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
              style={{ background: saving ? '#1E3A8A' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', opacity: saving ? 0.8 : 1 }}>
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
