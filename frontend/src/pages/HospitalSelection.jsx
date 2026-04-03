/**
 * HospitalSelection.jsx
 * ─────────────────────
 * Patient portal — choose a hospital.
 *
 * New behaviour (zero breaking changes to existing routing/auth/API):
 *  • On mount: requests GPS once via useGeolocation
 *  • Calculates Haversine distance to every hospital with valid coords
 *  • Sorts hospitals by distance (nearest first) when GPS is available
 *  • Shows "Nearest to you" banner at the top
 *  • Highlights nearest card with green border + "Nearest" badge
 *  • "Get Directions" button on each card opens DirectionsModal
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Building2, MapPin, Star, Navigation, AlertCircle } from 'lucide-react';
import { staggerContainer, fadeUp } from '../utils/motion';

// Stores & Services
import api from '../lib/api';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversineDistanceKm } from '../services/osrmService';

// Components
import HospitalCard from '../components/HospitalCard';
import Skeleton from '../components/Skeleton';
import PageLayout from '../layouts/PageLayout';
import Card from '../components/Card';

// Lazy-load DirectionsModal (pulls in leaflet only when needed)
const DirectionsModal = lazy(() => import('../components/DirectionsModal'));

// ── Haversine guard (same formula, local copy for sorting) ────────────────────
const safeDistance = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(Number(v)))) return Infinity;
  return haversineDistanceKm(Number(lat1), Number(lng1), Number(lat2), Number(lng2));
};

// ── HospitalSelection ─────────────────────────────────────────────────────────
const HospitalSelection = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  // Directions modal state
  const [directionsHospital, setDirectionsHospital] = useState(null);
  const [modalOpen,          setModalOpen]          = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const setSelectedHospital = useHospitalStore(s => s.setSelectedHospital);
  const navigate = useNavigate();

  // GPS — one-shot on mount
  const { getPosition, position: userLocation, geoError } = useGeolocation();

  // ── Fetch hospitals ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/hospitals');
        setHospitals(res.data?.data?.hospitals || []);
      } catch {
        toast.error('Failed to load hospitals');
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  // ── Request GPS once hospitals are loaded ───────────────────────────────────
  useEffect(() => {
    if (hospitals.length > 0) {
      getPosition().catch(() => {}); // errors already toasted inside hook
    }
  }, [hospitals.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Enrich hospitals with distance + sort ───────────────────────────────────
  const hospitalsWithDistance = useMemo(() => {
    return hospitals.map(h => ({
      ...h,
      _distanceKm: safeDistance(
        userLocation?.lat,
        userLocation?.lng,
        h.coordinates?.lat,
        h.coordinates?.lng
      ),
    }));
  }, [hospitals, userLocation]);

  const sortedHospitals = useMemo(() => {
    if (!userLocation) return hospitalsWithDistance;
    return [...hospitalsWithDistance].sort((a, b) => a._distanceKm - b._distanceKm);
  }, [hospitalsWithDistance, userLocation]);

  const nearestHospital = useMemo(() => {
    if (!userLocation) return null;
    const h = sortedHospitals[0];
    return h?._distanceKm !== Infinity ? h : null;
  }, [sortedHospitals, userLocation]);

  // ── Filtered list (search applied after sort) ───────────────────────────────
  const filteredHospitals = useMemo(() => {
    if (!search) return sortedHospitals;
    const q = search.toLowerCase();
    return sortedHospitals.filter(
      h =>
        h.name?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q)
    );
  }, [sortedHospitals, search]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((hospital) => {
    setSelectedHospital(hospital);
    navigate('/');
  }, [setSelectedHospital, navigate]);

  const handleGetDirections = useCallback((hospital) => {
    setDirectionsHospital(hospital);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    // keep directionsHospital set until modal fully closes to avoid flicker
    setTimeout(() => setDirectionsHospital(null), 300);
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout className="space-y-12 py-10">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-72 rounded-[2.5rem]" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="container mx-auto max-w-7xl px-4 py-12 space-y-16">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center text-center space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-200 mb-2">
          <Building2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-white font-display">
            Choose a Hospital
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl font-medium">
            Find a hospital near you and book your slot instantly. No more waiting in long physical queues.
          </p>
        </div>

        <div className="relative w-full max-w-xl mt-4 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-800/50 border-2 border-slate-700 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-medium placeholder:text-slate-500 text-white"
          />
        </div>
      </header>

      {/* ── Nearest hospital banner ───────────────────────────────────────── */}
      {nearestHospital && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border:     '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(16,185,129,0.15)' }}
            >
              <Navigation size={18} style={{ color: '#10B981' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                Nearest to you:{' '}
                <span style={{ color: '#10B981' }}>{nearestHospital.name}</span>
                {' '}—{' '}
                <span style={{ color: '#10B981' }}>
                  {nearestHospital._distanceKm.toFixed(1)} km away
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleGetDirections(nearestHospital)}
            aria-label={`Get directions to ${nearestHospital.name}`}
            className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: 'rgba(16,185,129,0.15)',
              border:     '1px solid rgba(16,185,129,0.3)',
              color:      '#10B981',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#10B981', e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)', e.currentTarget.style.color = '#10B981')}
          >
            <Navigation size={14} />
            Get Directions
          </button>
        </div>
      )}

      {/* GPS denied / error banner */}
      {geoError && !nearestHospital && (
        <div
          className="flex items-center gap-3 rounded-2xl px-6 py-4"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border:     '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <AlertCircle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#F59E0B' }}>
            Enable location for nearest hospital detection and walking directions.
          </p>
        </div>
      )}

      {/* ── Recommended carousel (unchanged) ─────────────────────────────── */}
      {hospitals.length > 0 && !search && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-white font-display">
              Recommended for You
            </h2>
            <button className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors">
              View All
            </button>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
            {hospitals.slice(0, 3).map(hospital => (
              <Card
                key={hospital._id}
                onClick={() => handleSelect(hospital)}
                className="min-w-[300px] md:min-w-[380px] p-6 cursor-pointer group hover:border-primary/50 hover:scale-[1.02] transition-all flex flex-col justify-between border-none shadow-premium rounded-3xl"
              >
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-600 px-3 py-1.5 rounded-xl text-xs font-black">
                    <Star size={12} fill="currentColor" />
                    {hospital.rating || '4.8'}
                  </div>
                </div>
                <div className="space-y-1.5 mt-5">
                  <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors font-display line-clamp-1">
                    {hospital.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin size={11} className="text-primary" />
                    {hospital.location}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Main hospital grid ────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredHospitals.map(hospital => (
          <motion.div
            key={hospital._id}
            variants={shouldReduceMotion ? {} : fadeUp}
          >
            <HospitalCard
              hospital={hospital}
              onSelect={handleSelect}
              isNearest={nearestHospital?._id === hospital._id}
              distanceKm={
                userLocation && hospital._distanceKm !== Infinity
                  ? hospital._distanceKm.toFixed(1)
                  : undefined
              }
              onGetDirections={handleGetDirections}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {filteredHospitals.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-slate-50/50 rounded-[3rem]">
          <div className="mb-6 text-8xl grayscale opacity-50">🏥</div>
          <h3 className="text-3xl font-black text-white font-display">No Hospitals Found</h3>
          <p className="text-slate-500 max-w-md mt-2 font-medium">
            We couldn't find any hospitals matching your search. Try another keyword or location.
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-8 font-bold text-primary hover:underline"
          >
            Clear Search
          </button>
        </Card>
      )}

      {/* ── Directions modal (lazy-loaded) ────────────────────────────────── */}
      <Suspense fallback={null}>
        <DirectionsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          hospital={directionsHospital}
          userLocation={userLocation}
        />
      </Suspense>
    </PageLayout>
  );
};

export default HospitalSelection;
