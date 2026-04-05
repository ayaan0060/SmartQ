import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, MapPin, Activity } from 'lucide-react';
import api from '../lib/api';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import PageLayout from '../layouts/PageLayout';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export default function PatientQueue() {
  const { selectedHospital } = useHospitalStore();
  const hospitalId = selectedHospital?._id;



  // Initial fetch
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['queue-my-status', hospitalId],
    queryFn: async () => {
      const res = await api.get('/queue/my-status');
      return res.data.data;
    },
    enabled: !!hospitalId,
    refetchInterval: 30000, // poll every 30s as fallback
  });

  // Socket.IO for live updates
  useEffect(() => {
    if (!hospitalId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('joinHospital', hospitalId);
    });

    socket.on('queue:update', () => {
      refetch();
    });

    socket.on('queue:add', () => {
      refetch();
    });

    socket.on('queue:remove', () => {
      refetch();
    });

    return () => {
      socket.emit('leaveHospital', hospitalId);
      socket.disconnect();
    };
  }, [hospitalId, refetch]);

  const queueData = data;

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getArrivalMinutes = (arrivalSuggestion) => {
    if (!arrivalSuggestion) return null;
    const diff = Math.max(0, Math.round((new Date(arrivalSuggestion) - new Date()) / 60000));
    return diff;
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const hasActiveToken = queueData && queueData.position !== undefined && queueData.position !== null;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Real-Time</span>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mt-2">Queue Status</h1>
          <p className="text-secondary text-sm mt-2">{selectedHospital?.name || 'Hospital'}</p>
        </div>

        {!hasActiveToken ? (
          /* No active token */
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-sm">
            <Activity size={64} className="mx-auto text-outline-variant mb-4" />
            <h3 className="text-2xl font-black text-on-surface">No Active Queue</h3>
            <p className="text-secondary mt-2">You don't have an active token in any queue right now.</p>
            <p className="text-secondary text-sm mt-1">Book an appointment or get a token to see your live queue status.</p>
          </div>
        ) : (
          <>
            {/* Live Status Card */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              {/* Live indicator bar */}
              <div className="bg-surface-container px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-green-700">Live</span>
                </div>
                <span className="text-xs text-secondary font-medium">
                  {selectedHospital?.name}
                </span>
              </div>

              {/* Main stats */}
              <div className="p-8 space-y-8">
                {/* Position */}
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">Your Position</p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={queueData.position}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-7xl font-black text-primary tracking-tighter"
                    >
                      {String(queueData.position).padStart(2, '0')}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Est. Wait Time</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={queueData.estimatedWaitTime}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-on-surface tracking-tight"
                      >
                        {queueData.estimatedWaitTime ?? '--'} <span className="text-base font-bold text-secondary">mins</span>
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="bg-surface-container rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={14} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Your Turn At</span>
                    </div>
                    <p className="text-3xl font-black text-on-surface tracking-tight">
                      {formatTime(queueData.predictedTurnTime)}
                    </p>
                  </div>
                </div>

                {/* Arrival suggestion */}
                {queueData.arrivalSuggestion && (
                  <div className="bg-primary-container/10 border border-primary-container/30 rounded-2xl px-6 py-4 flex items-center gap-3">
                    <MapPin size={18} className="text-primary shrink-0" />
                    <p className="text-sm font-medium text-on-surface">
                      {getArrivalMinutes(queueData.arrivalSuggestion) > 0
                        ? <>Please arrive in <strong>{getArrivalMinutes(queueData.arrivalSuggestion)} minutes</strong> (by {formatTime(queueData.arrivalSuggestion)})</>
                        : <>Please arrive now — your turn is approaching!</>
                      }
                    </p>
                  </div>
                )}

                {/* Bottom stats */}
                <div className="flex items-center justify-between pt-6 border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-secondary" />
                    <span className="text-sm text-secondary">Patients Ahead: <strong className="text-on-surface">{queueData.patientsAhead ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-secondary" />
                    <span className="text-sm text-secondary">Total Waiting: <strong className="text-on-surface">{queueData.totalWaiting ?? 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Token info */}
            {queueData.tokenNumber && (
              <div className="bg-surface-container-low rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Token Number</p>
                  <p className="text-2xl font-black text-primary tracking-tight mt-1">#{queueData.tokenNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Service</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{queueData.serviceName || 'General'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
