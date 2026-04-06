import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function PatientLookup() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await api.get(`/patients?search=${query.trim()}`);
      setPatients(r.data.data?.patients || r.data.data || []);
      setSearched(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Patient Lookup</h1>

      {/* Search */}
      <form onSubmit={search} className="flex gap-3">
        <div className="relative flex-1">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
          <input className="input pl-10" placeholder="Search by name, phone, or email..."
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}
           className="bg-(--smartq-red) text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all disabled:opacity-50">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {searched && patients.length === 0 ? (
        <EmptyState icon={User} title="No patients found" description="Try a different search term." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {patients.map(p => (
            <Card key={p._id} interactive>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-(--smartq-red) font-bold text-sm">
                  {p.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-(--foreground) truncate">{p.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {p.phone && (
                       <span className="flex items-center gap-1 text-xs text-(--muted)"><Phone size={11} /> {p.phone}</span>
                    )}
                    {p.email && (
                       <span className="flex items-center gap-1 text-xs text-(--muted)"><Mail size={11} /> {p.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
