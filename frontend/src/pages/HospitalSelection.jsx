import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Building2, MapPin, Star, Navigation, AlertCircle, Bookmark, SlidersHorizontal, Map } from 'lucide-react';

import api from '../lib/api';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversineDistanceKm } from '../services/osrmService';
import Skeleton from '../components/Skeleton';
import PageLayout from '../layouts/PageLayout';

const DirectionsModal = lazy(() => import('../components/DirectionsModal'));

const safeDistance = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(Number(v)))) return Infinity;
  return haversineDistanceKm(Number(lat1), Number(lng1), Number(lat2), Number(lng2));
};

// TODO: Replace with real wait time data from API
const MOCK_WAIT_TIMES = ['8 Min Wait', '25 Min Wait', '12 Min Wait', '5 Min Wait', '45 Min Wait', '15 Min Wait'];

export default function HospitalSelection() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('Nearby');
  const [directionsHospital, setDirectionsHospital] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const setSelectedHospital = useHospitalStore(s => s.setSelectedHospital);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { getPosition, position: userLocation, geoError } = useGeolocation();

  useEffect(() => {
    api.get('/hospitals')
      .then(r => setHospitals(r.data?.data?.hospitals || []))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (hospitals.length > 0) getPosition().catch(() => {});
  }, [hospitals.length]); // eslint-disable-line

  const hospitalsWithDistance = useMemo(() =>
    hospitals.map(h => ({
      ...h,
      _distanceKm: safeDistance(userLocation?.lat, userLocation?.lng, h.coordinates?.lat, h.coordinates?.lng),
    })),
    [hospitals, userLocation]
  );

  const sortedHospitals = useMemo(() => {
    if (!userLocation) return hospitalsWithDistance;
    return [...hospitalsWithDistance].sort((a, b) => a._distanceKm - b._distanceKm);
  }, [hospitalsWithDistance, userLocation]);

  const nearestHospital = useMemo(() => {
    if (!userLocation) return null;
    const h = sortedHospitals[0];
    return h?._distanceKm !== Infinity ? h : null;
  }, [sortedHospitals, userLocation]);

  const filteredHospitals = useMemo(() => {
    if (!search) return sortedHospitals;
    const q = search.toLowerCase();
    return sortedHospitals.filter(h => h.name?.toLowerCase().includes(q) || h.location?.toLowerCase().includes(q));
  }, [sortedHospitals, search]);

  const handleSelect = useCallback((hospital) => {
    setSelectedHospital(hospital);
    navigate(user?.role === 'patient' ? '/patient/dashboard' : '/dashboard');
  }, [setSelectedHospital, navigate, user]);

  const handleGetDirections = useCallback((hospital) => {
    setDirectionsHospital(hospital);
    setModalOpen(true);
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <header className="mb-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Provider Network</span>
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Select Care Center</h1>
            <p className="text-zinc-500 mt-2 max-w-md">Access real-time queue data and high-authority clinical facilities across the metropolitan area.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-container-high p-1 rounded-2xl flex">
              {['Nearby', 'Top Rated', 'Available'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filter === f ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-zinc-500'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="bg-surface-container-high p-3 rounded-2xl">
              <SlidersHorizontal size={20} className="text-on-surface" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex items-center bg-surface-container-low px-4 py-3 rounded-2xl gap-3">
          <Search size={20} className="text-on-surface-variant shrink-0" />
          <input
            type="text"
            placeholder="Search facilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface outline-none placeholder:text-secondary"
          />
        </div>
      </header>

      {/* Nearest banner */}
      {nearestHospital && (
        <div className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4 mb-8 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <Navigation size={18} className="text-green-600 shrink-0" />
            <p className="text-sm font-bold text-on-surface">
              Nearest to you: <span className="text-green-700">{nearestHospital.name}</span>
              {' '}— <span className="text-green-700">{nearestHospital._distanceKm.toFixed(1)} km away</span>
            </p>
          </div>
          <button
            onClick={() => handleGetDirections(nearestHospital)}
            className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-all"
          >
            <Navigation size={14} /> Get Directions
          </button>
        </div>
      )}

      {geoError && !nearestHospital && (
        <div className="flex items-center gap-3 rounded-2xl px-6 py-4 mb-8 bg-amber-50 border border-amber-200">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Enable location for nearest hospital detection and walking directions.</p>
        </div>
      )}

      {/* Hospital Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {filteredHospitals.map((hospital, idx) => {
          const isNearest = nearestHospital?._id === hospital._id;
          const waitLabel = MOCK_WAIT_TIMES[idx % MOCK_WAIT_TIMES.length]; // TODO: use real wait time
          const isLong = waitLabel.includes('25') || waitLabel.includes('45');

          return (
            <motion.article
              key={hospital._id}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(26,28,28,0.12)' }}
              className={`bg-surface-container-lowest rounded-2xl overflow-hidden group shadow-sm flex flex-col cursor-pointer ${isNearest ? 'ring-2 ring-green-400' : ''}`}
            >
              {/* Image / placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-surface-container to-surface-container-high overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 size={64} className="text-outline-variant group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-black text-on-surface">{hospital.rating || '4.8'}</span>
                </div>
                <div className={`absolute bottom-4 right-4 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isLong ? 'bg-zinc-800' : 'bg-primary'}`}>
                  {userLocation && hospital._distanceKm !== Infinity
                    ? `${hospital._distanceKm.toFixed(1)} km`
                    : waitLabel}
                </div>
                {isNearest && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Nearest
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-on-surface leading-tight">{hospital.name}</h3>
                  <Bookmark size={20} className="text-zinc-300 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-zinc-500 mb-6">
                  <MapPin size={14} className="shrink-0" />
                  <span className="text-xs font-medium">{hospital.location}</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(hospital)}
                    className="bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-colors"
                  >
                    Book Appointment
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGetDirections(hospital)}
                    className="bg-secondary-container text-on-secondary-container py-3 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                  >
                    Get Directions
                  </motion.button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      {filteredHospitals.length === 0 && (
        <div className="text-center py-24">
          <Building2 size={64} className="mx-auto text-outline-variant mb-4" />
          <h3 className="text-2xl font-black text-on-surface">No Hospitals Found</h3>
          <p className="text-secondary mt-2">Try a different search term.</p>
          <button onClick={() => setSearch('')} className="mt-6 text-primary font-bold hover:underline">Clear Search</button>
        </div>
      )}

      {/* Map FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 bg-zinc-900 text-white px-6 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50"
      >
        <Map size={20} />
        <span className="font-bold text-sm tracking-wide">Show Map View</span>
      </motion.button>

      <Suspense fallback={null}>
        <DirectionsModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setTimeout(() => setDirectionsHospital(null), 300); }}
          hospital={directionsHospital}
          userLocation={userLocation}
        />
      </Suspense>
    </PageLayout>
  );
}
