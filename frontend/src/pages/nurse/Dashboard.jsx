import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell, Users, Heart, AlertTriangle, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function NurseDashboard() {
  const [loading, setLoading] = useState(true);
  const [alerts] = useState([
    { id: 1, type: 'emergency', patient: 'Ahmad Khan', room: '202', time: '2m ago', msg: 'Oxygen saturation drops to 88%' },
    { id: 2, type: 'warning', patient: 'Sarah B.', room: '105', time: '15m ago', msg: 'Vitals check overdue' },
  ]);

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 800);
  }, []);

  const stats = [
    { label: 'Active Patients', value: '18', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Alerts Pending', value: alerts.length, icon: Bell, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Tasks Done', value: '12/20', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
  ];

  return (
    <motion.div className="space-y-8" {...fadeUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Nursing Station</h1>
          <p className="text-sm text-(--muted)">Shift: Morning (08:00 — 16:00)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-amber-200 transition-all active:scale-95 shadow-lg shadow-amber-500/10">
            <Bell size={14} /> Request Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} shrink-0`}>
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-(--foreground)">{value}</p>
                  <p className="text-xs text-(--muted)">{label}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-500/5">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Critical Monitoring
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 italic">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-white dark:bg-black/40 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600">
                      {alert.type === 'emergency' ? <Activity size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-(--foreground)">{alert.patient}</span>
                        <span className="text-[10px] bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-bold text-(--muted) uppercase tracking-wider">Room {alert.room}</span>
                      </div>
                      <p className="text-xs text-(--muted) mt-0.5">{alert.msg}</p>
                    </div>
                  </div>
                   <div className="text-right">
                    <p className="text-[10px] text-(--muted) font-bold mb-2 flex items-center justify-end gap-1"><Clock size={10} /> {alert.time}</p>
                    <button className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/20 px-2 py-1 rounded hover:bg-red-100 transition-all uppercase">Acknowledge</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Vital Trends (placeholder) */}
        <Card>
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-(--foreground) flex items-center gap-1.5">
              <TrendingUp size={20} className="text-blue-500" /> Vitals History
            </h2>
            <button className="text-xs font-bold text-(--muted) hover:text-(--foreground) transition-colors">See Detailed Logs →</button>
          </div>
          
           <div className="space-y-4">
            <div className="h-32 w-full bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-(--border) flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
                {/* SVG path to simulate an ECG wave */}
                <svg width="100%" height="80" viewBox="0 0 1000 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 50 L100 50 L120 20 L140 80 L160 50 L200 50 L220 50 L240 10 L260 90 L280 50 L320 50 L400 50 L420 20 L440 80 L460 50 L500 50 L520 10 L540 90 L560 50 L600 50 L700 50 L720 20 L740 80 L760 50 L800 50 L820 10 L840 90 L860 50 L900 50 L1000 50" 
                        stroke="#CB202D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ecg-line" />
                </svg>
              </div>
               <div className="relative text-center">
                <Heart size={24} className="mx-auto text-red-500 mb-1 group-hover:scale-125 transition-transform" fill="currentColor" />
                <p className="text-xs font-bold text-(--muted)">Average Heart Rate: 72 BPM</p>
              </div>
            </div>

             <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-white/5 border border-(--border) rounded-xl">
                <p className="text-[10px] font-bold text-(--muted) uppercase tracking-widest">Average SpO2</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold text-(--foreground)">98%</span>
                  <Badge variant="active">STABLE</Badge>
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 border border-(--border) rounded-xl">
                <p className="text-[10px] font-bold text-(--muted) uppercase tracking-widest">Temp (Avg)</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold text-(--foreground)">98.4°F</span>
                  <Badge variant="active">NORMAL</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Nursing Tasks */}
       <Card className="p-0! overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border) flex items-center justify-between">
          <h2 className="text-lg font-bold text-(--foreground)">Shift Tasks</h2>
          <Badge variant="waiting">8 PENDING</Badge>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {[
            { id: 1, task: 'Medication Administration', target: 'Patient A. Khan', room: '202', time: '10:00 AM', status: 'pending' },
            { id: 2, task: 'Wound Dressing Change', target: 'Sarah B.', room: '105', time: '10:30 AM', status: 'pending' },
            { id: 3, task: 'Check Vitals', target: 'John Doe', room: '310', time: '11:00 AM', status: 'pending' },
            { id: 4, task: 'Post-Op Observation', target: 'Michael F.', room: 'Post-Op', time: '11:15 AM', status: 'pending' },
          ].map((task) => (
             <div key={task.id} className="flex items-center justify-between px-5 py-3 border-b border-(--border) last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-(--muted)">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-(--foreground)">{task.task}</p>
                  <p className="text-[10px] text-(--muted) font-medium">{task.target} · {task.room}</p>
                </div>
              </div>
               <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-(--muted)">{task.time}</span>
                <button className="w-6 h-6 rounded-full border border-gray-200 dark:border-white/10 hover:border-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center text-transparent">
                  <CheckCircle2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
