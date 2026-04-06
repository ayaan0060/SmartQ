/**
 * AmbulancePage.jsx
 * ─────────────────
 * Patient-facing ambulance booking + live tracking page.
 * Single state machine: idle → waiting → dispatched → arrived → closed
 *
 * Route: /ambulance  (added to App.jsx)
 */

import React, {
  useState,
  useCallback,
  useEffect,
  lazy,
  Suspense,
  memo,
} from 'react';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { useHospitalStore } from '../../features/hospital/useHospitalStore';
import { usePatientTracking } from '../../hooks/usePatientTracking';
import RequestForm from '../../components/patient/RequestForm';
import WaitingScreen from '../../components/patient/WaitingScreen';

// Lazy-load the Leaflet map — never statically imported
const LiveTrackingMap = lazy(() => import('../../components/patient/LiveTrackingMap'));

// ── Status types ──────────────────────────────────────────────────────────────
// idle → waiting → dispatched → en_route → arriving → arrived → closed

// ── ArrivedScreen ─────────────────────────────────────────────────────────────
const ArrivedScreen = memo(({ requestId, onNewRequest }) => {
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const submitRating = async (r) => {
    setRating(r);
    try {
      await api.patch(`/emergency/requests/${requestId}/rate`, { rating: r });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch {
      // Rating is optional — silently ignore errors
      setSubmitted(true);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#0B0F19' }}
    >
      <div
        className="flex h-28 w-28 items-center justify-center rounded-full text-5xl mb-6"
        style={{
          background: 'rgba(16,185,129,0.15)',
          border:     '2px solid rgba(16,185,129,0.3)',
          animation:  'arrivedPulse 2s ease-in-out 3',
        }}
      >
        ✅
      </div>

      <h2 className="text-2xl font-black text-white mb-2">Ambulance has arrived!</h2>
      <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
        Please come to the entrance. The driver is waiting for you.
      </p>

      {/* Star rating */}
      {!submitted ? (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
            Rate this response (optional)
          </p>
          <div className="flex items-center gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => submitRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  size={32}
                  fill={(hovered || rating) >= n ? '#F59E0B' : 'none'}
                  style={{ color: (hovered || rating) >= n ? '#F59E0B' : '#334155' }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
            ⭐ Thank you for your feedback!
          </p>
        </div>
      )}

      <button
        onClick={onNewRequest}
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all"
        style={{ background: '#1E293B', border: '1px solid #334155' }}
      >
        Make a New Request
      </button>

      <style>{`
        @keyframes arrivedPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
});
ArrivedScreen.displayName = 'ArrivedScreen';

// ── TrackingView ──────────────────────────────────────────────────────────────
// Wrapper that wires usePatientTracking → LiveTrackingMap
const TrackingView = memo(({ requestId, initialData, onArrived, onCancel }) => {
  const [cancelling, setCancelling] = useState(false);

  const { ambulance, ambulanceLocation, routeCoords, eta, status } =
    usePatientTracking(requestId, initialData);

  // Trigger arrived state when status reaches arrived
  React.useEffect(() => {
    if (status === 'arrived' || status === 'completed') onArrived();
  }, [status, onArrived]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await api.patch(`/emergency/requests/${requestId}/cancel`);
      onCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel at this stage');
    } finally {
      setCancelling(false);
    }
  }, [requestId, onCancel]);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 56px)' }}>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center" style={{ background: '#0B0F19' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#DC2626' }} />
          </div>
        }
      >
        <LiveTrackingMap
          mapKey={requestId}
          patientLocation={initialData?.patientLocation}
          ambulanceLocation={ambulanceLocation}
          routeCoords={routeCoords}
          eta={eta}
          status={status}
          ambulance={ambulance}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
      </Suspense>
    </div>
  );
});
TrackingView.displayName = 'TrackingView';

// ── AmbulancePage ─────────────────────────────────────────────────────────────
const AmbulancePage = () => {
  const { user: _user }      = useAuthStore();
  const { selectedHospital } = useHospitalStore();
  const navigate             = useNavigate();

  // Single state machine variable
  const [status,      setStatus]      = useState('idle');
  const [requestId,   setRequestId]   = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [cancelling,  setCancelling]  = useState(false);

  const hospitalId = selectedHospital?._id;

  // ── Socket: listen for dispatch while in waiting state ──────────────────
  useEffect(() => {
    if (status !== 'waiting' || !requestId) return;

    if (!socket.connected) socket.connect();
    socket.emit('join:emergency', requestId);

    const onDispatched = (data) => {
      if (data.requestId?.toString() !== requestId.toString()) return;
      setInitialData(prev => ({
        ...prev,
        status:    'dispatched',
        ambulance: {
          _id:           data.ambulanceId,
          vehicleNumber: data.vehicleNumber,
          driverName:    data.driverName,
          driverPhone:   data.driverPhone,
        },
      }));
      setStatus('dispatched');
      toast.success('🚑 Ambulance dispatched! Track it live.');
    };

    const onStatusUpdate = (data) => {
      if (data.requestId?.toString() !== requestId.toString()) return;
      if (data.status === 'cancelled') {
        setStatus('idle');
        setRequestId(null);
        toast.error('Request was cancelled.');
      }
    };

    socket.on('emergency:dispatched',     onDispatched);
    socket.on('emergency:status:updated', onStatusUpdate);

    return () => {
      socket.off('emergency:dispatched',     onDispatched);
      socket.off('emergency:status:updated', onStatusUpdate);
    };
  }, [status, requestId]);

  // ── Submit request ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async ({ emergencyType, notes, patientLocation }) => {
    if (!hospitalId) {
      toast.error('Please select a hospital first');
      navigate('/select-hospital');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/emergency/request', {
        hospitalId,
        emergencyType,
        notes,
        patientLocation,
      });
      const req = res.data.data.request;
      setRequestId(req._id);
      setInitialData({
        status:          req.status,
        patientLocation: req.patientLocation,
        ambulance:       null,
        ambulanceLocation: null,
      });
      setStatus('waiting');
      toast.success('🚨 Emergency request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  }, [hospitalId, navigate]);

  // ── Cancel from waiting screen ──────────────────────────────────────────────
  const handleCancelWaiting = useCallback(async () => {
    if (!requestId) { setStatus('idle'); return; }
    setCancelling(true);
    try {
      await api.patch(`/emergency/requests/${requestId}/cancel`);
      setStatus('idle');
      setRequestId(null);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  }, [requestId]);

  // ── Arrived callback ────────────────────────────────────────────────────────
  const handleArrived = useCallback(() => setStatus('arrived'), []);

  // ── Cancel from tracking view ───────────────────────────────────────────────
  const handleCancelTracking = useCallback(() => {
    setStatus('idle');
    setRequestId(null);
    setInitialData(null);
  }, []);

  // ── New request ─────────────────────────────────────────────────────────────
  const handleNewRequest = useCallback(() => {
    setStatus('idle');
    setRequestId(null);
    setInitialData(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0B0F19' }}>

      {/* Top bar — shown on idle and waiting states */}
      {(status === 'idle' || status === 'waiting') && (
        <header
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#0D1117', borderBottom: '1px solid #1E293B', minHeight: '56px' }}
        >
          <Link
            to="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-white">Emergency Ambulance</p>
            <p className="text-xs" style={{ color: '#475569' }}>
              {selectedHospital?.name || 'SmartQ'}
            </p>
          </div>
        </header>
      )}

      {/* Tracking top bar */}
      {(status === 'dispatched' || status === 'en_route' || status === 'arriving') && (
        <header
          className="flex items-center gap-3 px-4 shrink-0"
          style={{
            background:   '#0D1117',
            borderBottom: '1px solid #1E293B',
            minHeight:    '56px',
            zIndex:       20,
          }}
        >
          <div
            className="flex h-2.5 w-2.5 rounded-full animate-pulse shrink-0"
            style={{ background: '#DC2626' }}
          />
          <p className="text-sm font-bold text-white">
            {status === 'arriving' ? '🚑 Ambulance is arriving!' : '🚑 Ambulance en route'}
          </p>
          {requestId && (
            <span className="ml-auto text-xs font-mono" style={{ color: '#475569' }}>
              #{String(requestId).slice(-6).toUpperCase()}
            </span>
          )}
        </header>
      )}

      {/* ── State machine ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">

        {status === 'idle' && (
          <RequestForm onSubmit={handleSubmit} submitting={submitting} />
        )}

        {status === 'waiting' && (
          <WaitingScreen
            requestId={requestId}
            onCancel={handleCancelWaiting}
            cancelling={cancelling}
          />
        )}

        {(status === 'dispatched' || status === 'en_route' || status === 'arriving') && (
          <TrackingView
            requestId={requestId}
            initialData={initialData}
            onArrived={handleArrived}
            onCancel={handleCancelTracking}
          />
        )}

        {status === 'arrived' && (
          <ArrivedScreen requestId={requestId} onNewRequest={handleNewRequest} />
        )}
      </div>
    </div>
  );
};

export default AmbulancePage;
