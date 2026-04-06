import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Phone, MapPin, Activity, User, ExternalLink, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function PatientWatch() {
  const [query, setQuery] = useState('');
  const [patients] = useState([
    { id: 1, name: 'Ahmad Khan', age: 45, gender: 'Male', room: '202', status: 'critical', pulse: 92, spo2: 89, bp: '140/90' },
    { id: 2, name: 'Sarah B.', age: 32, gender: 'Female', room: '105', status: 'stable', pulse: 74, spo2: 98, bp: '120/80' },
    { id: 3, name: 'John Doe', age: 58, gender: 'Male', room: '310', status: 'stable', pulse: 68, spo2: 97, bp: '118/75' },
    { id: 4, name: 'Michael F.', age: 29, gender: 'Male', room: 'Post-Op', status: 'monitoring', pulse: 82, spo2: 96, bp: '130/85' },
  ]);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.room.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Patient Watch</h1>
          <p className="text-sm text-(--muted)">Real-time monitoring of all active patients in your sector.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emergency" dot>4 ACTIVE MONITORING</Badge>
        </div>
      </div>

      <Card className="flex items-center gap-3">
        <Search size={18} className="text-(--muted)" />
        <input 
          className="bg-transparent border-none outline-none text-sm font-medium w-full text-(--foreground) placeholder-(--muted)"
          placeholder="Search by Patient Name or Room Number..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyState icon={Users} title="No patients found" description="Try searching for a different name or room." />
          </div>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} interactive className={p.status === 'critical' ? 'border-l-4 border-l-red-500 shadow-lg shadow-red-500/5' : ''}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${p.status === 'critical' ? 'bg-red-50 dark:bg-red-500/20 text-red-600' : 'bg-gray-100 dark:bg-white/5 text-(--muted)'}`}>
                    {p.name.charAt(0)}
                  </div>
                   <div>
                    <h3 className="text-sm font-bold text-(--foreground)">{p.name}</h3>
                    <p className="text-[10px] text-(--muted) uppercase font-bold tracking-widest">{p.gender}, {p.age}y · ROOM {p.room}</p>
                  </div>
                </div>
                <Badge variant={p.status === 'critical' ? 'emergency' : 'active'}>{p.status.toUpperCase()}</Badge>
              </div>

               <div className="grid grid-cols-3 gap-2 py-3 border-y border-(--border) mb-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-(--muted) mb-1">Pulse</p>
                  <p className={`text-sm font-bold ${p.pulse > 90 ? 'text-red-500' : 'text-(--foreground)'}`}>{p.pulse} BPM</p>
                </div>
                <div className="text-center border-x border-(--border)">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-(--muted) mb-1">SpO2</p>
                  <p className={`text-sm font-bold ${p.spo2 < 92 ? 'text-red-500' : 'text-(--foreground)'}`}>{p.spo2}%</p>
                </div>
                 <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-(--muted) mb-1">BP</p>
                  <p className="text-sm font-bold text-(--foreground)">{p.bp}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5">
                    <Activity size={14} /> Update Vitals
                  </button>
                   <button className="text-xs font-bold text-(--muted) hover:text-(--foreground) transition-colors flex items-center gap-1.5">
                    <Calendar size={14} /> History
                  </button>
                </div>
                <button className="text-(--muted) hover:text-(--smartq-red) transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
