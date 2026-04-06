import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState([
    { day: 'Monday', start: '09:00', end: '13:00', active: true },
    { day: 'Tuesday', start: '09:00', end: '13:00', active: true },
    { day: 'Wednesday', start: '09:00', end: '13:00', active: true },
    { day: 'Thursday', start: '09:00', end: '13:00', active: true },
    { day: 'Friday', start: '09:00', end: '13:00', active: true },
  ]);

  const toggleDay = (day) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, active: !s.active } : s));
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Consultation Hours</h1>
          <p className="text-sm text-(--muted)">Manage your weekly availability for appointments.</p>
        </div>
         <button className="bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95">
          <CheckCircle2 size={16} /> Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {WEEKDAYS.map((day) => {
            const daySched = schedule.find(s => s.day === day) || { day, active: false };
             return (
               <Card key={day} className={`flex items-center justify-between py-3 px-5 transition-all ${daySched.active ? 'border-l-4 border-l-(--smartq-red) bg-white/50 dark:bg-white/2' : 'opacity-60 bg-gray-50/50 dark:bg-black/20'}`}>
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${daySched.active ? 'bg-red-50 dark:bg-red-500/15 text-(--smartq-red)' : 'bg-gray-100 dark:bg-white/5 text-(--muted)'}`}>
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-(--foreground)">{day}</p>
                    <p className="text-xs text-(--muted)">{daySched.active ? `${daySched.start} — ${daySched.end}` : 'Unavailable'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {daySched.active && (
                     <div className="flex items-center gap-2">
                      <input type="time" defaultValue={daySched.start} className="bg-transparent border border-(--border) rounded px-2 py-1 text-xs font-semibold text-(--foreground) outline-none focus:border-(--smartq-red)" />
                      <span className="text-xs text-(--muted) font-bold">—</span>
                      <input type="time" defaultValue={daySched.end} className="bg-transparent border border-(--border) rounded px-2 py-1 text-xs font-semibold text-(--foreground) outline-none focus:border-(--smartq-red)" />
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleDay(day)}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${daySched.active ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'}`}
                  >
                    {daySched.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card className="bg-red-50/50 dark:bg-red-500/5 border-dashed border-red-200 dark:border-red-900/40">
            <h3 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
              <Clock size={16} /> Urgent Blocking
            </h3>
            <p className="text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed">
              If you need to block all consultations for the next 2 hours due to an emergency procedure.
            </p>
            <button className="w-full mt-4 bg-red-600 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95">
              <AlertTriangle size={14} /> Emergency Block
            </button>
          </Card>

           <Card>
            <h3 className="text-sm font-bold text-(--foreground) flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-(--smartq-red)" /> Planned Leave
            </h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-(--border)">
                <div className="text-[10px] uppercase tracking-wider font-bold text-(--foreground)">
                  18 Feb — 22 Feb
                </div>
                <button className="text-(--muted) hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <button className="w-full border border-dashed border-(--border) rounded-lg py-2.5 text-xs font-bold text-(--muted) hover:text-(--foreground) hover:border-(--muted) transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Add Leave Period
              </button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
