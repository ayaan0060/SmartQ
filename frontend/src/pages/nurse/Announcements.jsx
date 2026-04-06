import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle2, Megaphone, Calendar, Clock, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function Announcements() {
  const announcements = [
    { id: 1, type: 'emergency', title: 'System Upgrade Notice', content: 'The hospital HIS system will undergo maintenance at 11:00 PM tonight. Please switch to manual token recording.', author: 'Admin-IT', time: '2h ago' },
    { id: 2, type: 'info', title: 'New Staff Protocol', content: 'Effective immediately, all nursing staff must verify UHID during morning rounds.', author: 'Dr. Sarah Smith', time: '5h ago' },
    { id: 3, type: 'success', title: 'Blood Donation Camp', content: 'The annual blood donation drive was a huge success. Thank you to everyone for participating.', author: 'Head Nurse', time: '1d ago' },
  ];

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Announcements</h1>
          <p className="text-sm text-(--muted)">Important updates and broadcasts for the hospital staff.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="active" dot>3 NEW UPDATES</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card key={ann.id} className={`group border-l-4 ${ann.type === 'emergency' ? 'border-l-red-500' : ann.type === 'info' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ann.type === 'emergency' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : ann.type === 'info' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-green-50 dark:bg-green-500/10 text-green-600'}`}>
                {ann.type === 'emergency' ? <AlertTriangle size={20} /> : ann.type === 'info' ? <Info size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-(--foreground) group-hover:text-(--smartq-red) transition-colors">{ann.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-(--muted) uppercase tracking-wider">
                    <Clock size={10} /> {ann.time}
                  </div>
                </div>
                 <p className="text-xs text-(--muted) leading-relaxed mb-4">{ann.content}</p>
                 <div className="flex items-center justify-between border-t border-(--border) pt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--muted) uppercase tracking-wider">
                    <User size={12} className="text-(--smartq-red)" /> {ann.author}
                  </div>
                  <button className="text-[10px] font-bold text-(--muted) hover:text-(--foreground) transition-colors uppercase tracking-widest">Mark as Read</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

       <Card className="bg-gray-50/50 dark:bg-white/2 border-dashed border-(--border) flex flex-col items-center justify-center py-10">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-(--muted) mb-4">
          <Megaphone size={24} />
        </div>
         <p className="text-xs font-bold text-(--muted) uppercase tracking-widest mb-1">Stay Informed</p>
        <p className="text-sm text-(--muted) text-center px-6">Announcements older than 30 days are automatically archived.</p>
      </Card>
    </motion.div>
  );
}
