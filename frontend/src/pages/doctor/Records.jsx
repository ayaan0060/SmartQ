import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FolderOpen, FileText, User, Calendar, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function PatientRecords() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const r = await api.get(`/patients?search=${query.trim()}`);
      setResults(r.data.data?.patients || r.data.data || []);
    } catch {
      toast.error('Failed to fetch patient records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Patient Records</h1>
        <p className="text-sm text-(--muted)">Access clinical history and digital health folders.</p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
            <input
              className="input pl-10"
              placeholder="Search by Patient Name, Phone, or UHID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
           <button
            type="submit"
            disabled={loading}
            className="bg-(--smartq-red) text-white rounded-lg px-6 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </Card>

      {hasSearched && results.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No records found" description="No patient profiles match your search criteria." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((patient) => (
            <Card key={patient._id} interactive>
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center text-2xl font-black text-on-primary ${!patient.isOnline ? 'grayscale' : ''}`}>
                  <User size={20} />
                </div>
                 <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-(--foreground) truncate">{patient.name}</p>
                    <button className="text-(--muted) hover:text-(--smartq-red) transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-(--muted) mt-0.5">UHID: {patient._id?.slice(-8).toUpperCase()}</p>
                  
                   <div className="mt-3 flex items-center gap-4 border-t border-(--border) pt-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-(--muted)">
                      <FileText size={12} /> 12 Reports
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-(--muted)">
                      <Calendar size={12} /> Last Visit: 12 Jan
                    </div>
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
