import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Thermometer, Droplet, User, Save, Clock, ChevronDown } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function VitalsEntry() {
  const [loading, setLoading] = useState(false);
  const [_selectedPatient, setSelectedPatient] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Vitals recorded successfully');
    }, 1000);
  };

  return (
    <motion.div className="max-w-2xl mx-auto space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Record Vitals</h1>
        <Badge variant="active" dot>REAL-TIME SYNC</Badge>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">Select Patient</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
              <select 
                className="input pl-10 appearance-none cursor-pointer" 
                required
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Choose Patient...</option>
                <option value="1">Ahmad Khan [Room 202]</option>
                <option value="2">Sarah B. [Room 105]</option>
                <option value="3">John Doe [Room 310]</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted) pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">Heart Rate (BPM)</label>
              <div className="relative">
                <Heart size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                <input type="number" className="input pl-10" placeholder="e.g. 72" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">SpO2 (%)</label>
              <div className="relative">
                <Activity size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                <input type="number" className="input pl-10" placeholder="e.g. 98" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">Blood Pressure (mmHg)</label>
              <div className="relative">
                <Droplet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600" />
                <input type="text" className="input pl-10" placeholder="e.g. 120/80" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">Temperature (°F)</label>
              <div className="relative">
                <Thermometer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                <input type="number" step="0.1" className="input pl-10" placeholder="e.g. 98.4" required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-(--muted)">Clinical Notes</label>
            <textarea 
              className="input min-h-[100px] py-3 resize-none" 
              placeholder="Observation notes, medication response, etc."
            ></textarea>
          </div>

           <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--smartq-red) text-white rounded-xl py-3 text-sm font-bold uppercase tracking-widest hover:bg-(--smartq-red-hover) transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Submitting...' : 'Record Vitals'}
          </button>
        </form>
      </Card>

      <Card className="bg-blue-50/30 dark:bg-blue-500/5 border-blue-100 dark:border-blue-900/30">
        <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2 uppercase tracking-widest">
          <Clock size={14} /> Last Update
        </h3>
        <p className="text-xs text-blue-700/80 dark:text-blue-400/80">
          Last vitals for Ahmad Khan recorded 14m ago by Nurse Emily.
        </p>
      </Card>
    </motion.div>
  );
}
