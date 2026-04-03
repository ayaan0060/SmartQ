import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, MapPin, Building2, Stethoscope } from 'lucide-react';
import api from '../lib/api';

import { useAuthStore } from '../features/auth/useAuthStore';

const MEDTRIAGE_BASE = 'http://localhost:8000/ui';

function getMedTriageUrl() {
  try {
    const user = useAuthStore.getState().user;
    if (user?.name) return `${MEDTRIAGE_BASE}?name=${encodeURIComponent(user.name)}&role=${encodeURIComponent(user.role || 'patient')}`;
  } catch {}
  return MEDTRIAGE_BASE;
}

const TRIAGE_API = 'http://localhost:8000';

// Client-side symptom keywords to help the backend recognize symptoms
// These are sent as enriched input to improve NER accuracy
const SYMPTOM_HINTS = [
  'chest pain','chest tightness','shortness of breath','breathless','can\'t breathe',
  'headache','severe headache','sudden headache','migraine',
  'fever','high fever','temperature','chills',
  'cough','dry cough','coughing',
  'nausea','vomiting','throwing up',
  'dizziness','dizzy','lightheaded',
  'fatigue','tired','weakness','weak',
  'abdominal pain','stomach pain','stomach ache','belly pain',
  'back pain','lower back pain',
  'sweating','sweaty','diaphoresis',
  'palpitations','heart racing','fast heartbeat',
  'rash','skin rash','hives',
  'swollen leg','leg swelling',
  'facial drooping','face drooping',
  'arm weakness','weak arm',
  'slurred speech','slurring',
  'confusion','confused',
  'syncope','fainted','passed out',
  'sore throat','throat pain',
  'runny nose','stuffy nose',
  'body aches','muscle pain',
  'eye pain','blurred vision',
  'neck stiffness','stiff neck',
  'joint pain','swelling',
  'diarrhea','constipation',
  'painful urination','frequent urination',
  'anxiety','depression','stress',
  'tooth pain','dental pain',
];

function enrichInput(text) {
  // Detect symptoms in user text and append them explicitly to help NER
  const lower = text.toLowerCase();
  const found = SYMPTOM_HINTS.filter(s => lower.includes(s));
  if (found.length === 0) return text;
  return `${text}. Symptoms mentioned: ${found.join(', ')}.`;
}

const URGENCY_DEPT = {
  CRITICAL: 'Emergency',
  HIGH: 'Emergency',
  MEDIUM: 'General Medicine',
  LOW: 'General Medicine',
};

const CONDITION_DEPT = [
  { keywords: ['cardiac', 'myocardial', 'angina', 'heart', 'arrhythmia'], dept: 'Cardiology', icon: '❤️' },
  { keywords: ['stroke', 'tia', 'hemorrhage', 'neurolog'], dept: 'Neurology', icon: '🧠' },
  { keywords: ['pulmonary', 'asthma', 'pneumonia', 'respiratory', 'covid'], dept: 'Pulmonology', icon: '🫁' },
  { keywords: ['fracture', 'bone', 'ortho', 'sprain', 'joint'], dept: 'Orthopedics', icon: '🦴' },
  { keywords: ['gastro', 'appendicitis', 'gi bleed', 'abdominal', 'stomach', 'nausea', 'vomit'], dept: 'Gastroenterology', icon: '🫃' },
  { keywords: ['kidney', 'renal', 'nephro', 'bladder', 'urine'], dept: 'Nephrology', icon: '🫘' },
  { keywords: ['sepsis', 'meningitis', 'infection', 'fever'], dept: 'General Medicine', icon: '🩺' },
  { keywords: ['eye', 'glaucoma', 'ophthal', 'vision', 'blur'], dept: 'Ophthalmology', icon: '👁️' },
  { keywords: ['skin', 'rash', 'dermat', 'itch', 'acne'], dept: 'Dermatology', icon: '🩹' },
  { keywords: ['diabetes', 'hypoglycemia', 'thyroid', 'endocrin'], dept: 'Endocrinology', icon: '💉' },
  { keywords: ['child', 'baby', 'infant', 'pediatric'], dept: 'Pediatrics', icon: '👶' },
  { keywords: ['tooth', 'dental', 'gum', 'mouth'], dept: 'Dental', icon: '🦷' },
  { keywords: ['mental', 'anxiety', 'depression', 'stress', 'sleep'], dept: 'Psychiatry', icon: '🧘' },
  { keywords: ['emergency', 'critical', 'unconscious', 'bleeding', 'accident'], dept: 'Emergency', icon: '🚨' },
];

function inferDept(triage) {
  if (!triage) return null;
  const conditions = (triage.possible_conditions || []).join(' ').toLowerCase();
  for (const rule of CONDITION_DEPT) {
    if (rule.keywords.some(k => conditions.includes(k))) return { dept: rule.dept, icon: rule.icon };
  }
  const dept = URGENCY_DEPT[triage.urgency_level] || 'General Medicine';
  return { dept, icon: '🩺' };
}

function findService(services, deptName) {
  if (!deptName) return null;
  const lower = deptName.toLowerCase();
  return (
    services.find(s => s.name?.toLowerCase().includes(lower)) ||
    services.find(s => lower.includes(s.name?.toLowerCase())) ||
    null
  );
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const URGENCY_STYLE = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🚨' },
  HIGH:     { color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '⚠️' },
  MEDIUM:   { color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  icon: '🔶' },
  LOW:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  icon: '✅' },
};

const INITIAL_MESSAGES = [
  { from: 'bot', text: "Hi! I'm your SmartQ Triage Assistant 🏥" },
  { from: 'bot', text: "Describe your symptoms in plain English and I'll assess urgency, recommend a department, and find the nearest hospital." },
  { from: 'bot', text: "Example: \"I have chest pain and shortness of breath\" or \"I have a fever and headache\"" },
];

let _uid = 0;
const uid = () => ++_uid;

const TriageBot = ({ services = [], onBook }) => {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const recognitionRef = useRef(null);

  // Fetch hospitals from DB on mount
  useEffect(() => {
    api.get('/hospitals').then(res => {
      setHospitals(res.data?.data?.hospitals || []);
    }).catch(() => {});
  }, []);

  // Get user geolocation on open
  useEffect(() => {
    if (open && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Find nearest hospital from DB
  const getNearestHospital = useCallback(() => {
    if (!hospitals.length) return null;
    if (!userLocation) return hospitals[0]; // fallback to first if no GPS

    let nearest = null, minDist = Infinity;
    for (const h of hospitals) {
      if (!h.coordinates?.lat || !h.coordinates?.lng) continue;
      const d = haversine(userLocation.lat, userLocation.lng, h.coordinates.lat, h.coordinates.lng);
      if (d < minDist) { minDist = d; nearest = { ...h, _distKm: d.toFixed(1) }; }
    }
    // If no hospital has coordinates, just return first with a maps search link
    return nearest || { ...hospitals[0], _noCoords: true };
  }, [hospitals, userLocation]);

  const addMsg = (from, text, extra = {}) =>
    setMessages(prev => [...prev, { from, text, id: uid(), ...extra }]);

  const send = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    setLoading(true);
    addMsg('user', userText);

    try {
      const { data } = await axios.post(`${TRIAGE_API}/chat`, {
        session_id: sessionId,
        user_input: enrichInput(userText),
        patient_info: {},
      });

      const reply  = data.reply || '';
      const triage = data.triage || null;
      const nodes  = data.neo4j_nodes || [];

      addMsg('bot', reply, { nodes });

      if (triage) {
        const deptInfo = inferDept(triage);
        const service  = findService(services, deptInfo?.dept);
        const nearest  = getNearestHospital();
        addMsg('bot', '', { triageSummary: triage, deptInfo, suggestedService: service, nearestHospital: nearest });
      } else if (nodes.length === 0 && !reply) {
        addMsg('bot', "I couldn't detect specific symptoms. Could you describe what you're feeling in more detail? For example: \"I have chest pain and fever\".");
      }
    } catch {
      // Fallback: do client-side triage if backend is unreachable
      const lower = userText.toLowerCase();
      const matched = SYMPTOM_HINTS.filter(s => lower.includes(s));
      if (matched.length > 0) {
        addMsg('bot', `I detected these symptoms: ${matched.join(', ')}. The triage backend is offline, but based on your symptoms I recommend visiting a hospital. Please try again shortly.`, { nodes: matched });
      } else {
        addMsg('bot', 'Could not reach the triage backend. Please make sure it is running on port 8000.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, sessionId, services, getNearestHospital]);

  const toggleVoice = useCallback(() => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addMsg('bot', 'Voice input is not supported in this browser.'); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    recognitionRef.current = rec;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => { setListening(false); recognitionRef.current = null; };
    rec.onerror  = () => { setListening(false); recognitionRef.current = null; };
    rec.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      setInput(final || interim);
    };
    rec.start();
  }, [listening]);

  const handleBookFromBot = (service) => { setOpen(false); onBook(service); };

  const mapsUrl = (hospital) => {
    if (hospital?.coordinates?.lat && hospital?.coordinates?.lng) {
      const dest = `${hospital.coordinates.lat},${hospital.coordinates.lng}`;
      return userLocation
        ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${dest}`
        : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital?.name + ' hospital')}`;
  };

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open triage assistant"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 rounded-[1.75rem] overflow-hidden shadow-2xl flex flex-col"
          style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '72vh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#1E293B' }}>
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Bot size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Triage Assistant</p>
              <p className="text-[10px] text-slate-400 font-medium">BioBERT · Neo4j · Real-time NER</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
            </div>
          </div>

          {/* Full AI banner */}
          <div className="flex items-center justify-between px-4 py-2"
            style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <p className="text-[10px] text-slate-500 font-medium">Need deeper analysis?</p>
            <button
              onClick={() => window.open(getMedTriageUrl(), '_blank')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              🧠 MedTriage AI ↗
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg) => (
              <div key={msg.id ?? msg.text} className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center mt-0.5">
                    <Bot size={13} className="text-blue-400" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  {/* Text bubble */}
                  {msg.text ? (
                    <div className="px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed"
                      style={{
                        background: msg.from === 'user' ? '#2563EB' : '#1E293B',
                        color: msg.from === 'user' ? '#fff' : '#CBD5E1',
                        borderBottomRightRadius: msg.from === 'user' ? 4 : undefined,
                        borderBottomLeftRadius:  msg.from === 'bot'  ? 4 : undefined,
                      }}>
                      {msg.text}
                    </div>
                  ) : null}

                  {/* Symptom tags */}
                  {msg.nodes?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {msg.nodes.map((n, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(99,102,241,0.18)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Triage result card */}
                  {msg.triageSummary && (() => {
                    const t   = msg.triageSummary;
                    const cfg = URGENCY_STYLE[t.urgency_level] || URGENCY_STYLE.LOW;
                    const { dept, icon: deptIcon } = msg.deptInfo || {};
                    const hospital = msg.nearestHospital;

                    return (
                      <div className="rounded-2xl p-3 space-y-2.5"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

                        {/* Urgency */}
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <span className="text-xs font-black" style={{ color: cfg.color }}>
                            {t.urgency_level} — {t.recommended_action}
                          </span>
                        </div>

                        {/* Possible conditions */}
                        {t.possible_conditions?.length > 0 && (
                          <p className="text-[11px] text-slate-400">
                            Possible: {t.possible_conditions.slice(0, 2).join(', ')}
                          </p>
                        )}

                        {/* Department recommendation */}
                        {dept && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Stethoscope size={13} style={{ color: cfg.color, flexShrink: 0 }} />
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Recommended Department</p>
                              <p className="text-sm font-black text-white">{deptIcon} {dept}</p>
                            </div>
                          </div>
                        )}

                        {/* Nearest hospital */}
                        {hospital && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Building2 size={13} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Nearest Hospital</p>
                              <p className="text-sm font-black text-white truncate">{hospital.name}</p>
                              {hospital.location && (
                                <p className="text-[10px] text-slate-400 truncate">{hospital.location}</p>
                              )}
                              {hospital._distKm && (
                                <p className="text-[10px] font-bold" style={{ color: '#10B981' }}>{hospital._distKm} km away</p>
                              )}
                            </div>
                            <a href={mapsUrl(hospital)} target="_blank" rel="noreferrer"
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all hover:scale-105"
                              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                              <MapPin size={10} /> Maps
                            </a>
                          </div>
                        )}

                        {/* Book / Find button */}
                        {msg.suggestedService ? (
                          <button onClick={() => handleBookFromBot(msg.suggestedService)}
                            className="w-full py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                            Book Token — {msg.suggestedService.name}
                          </button>
                        ) : (
                          <button onClick={() => handleBookFromBot(null)}
                            className="w-full py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                            Browse Hospitals →
                          </button>
                        )}

                        {/* Switch to full MedTriage AI */}
                        <button
                          onClick={() => window.open(getMedTriageUrl(), '_blank')}
                          className="w-full py-2 rounded-xl text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}
                        >
                          🧠 Get deeper analysis → MedTriage AI
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {msg.from === 'user' && (
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-slate-700 flex items-center justify-center mt-0.5">
                    <User size={13} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 items-center">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bot size={13} className="text-blue-400" />
                </div>
                <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: '#1E293B' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Describe your symptoms…"
              disabled={loading}
              className="flex-1 h-10 rounded-xl px-4 text-sm text-white placeholder-slate-500 outline-none"
              style={{ background: '#1E293B', border: '1px solid #334155' }}
            />
            <button onClick={toggleVoice}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: listening ? 'rgba(239,68,68,0.2)' : '#1E293B', border: '1px solid #334155' }}
              title="Voice input">
              {listening ? <MicOff size={15} className="text-red-400 animate-pulse" /> : <Mic size={15} className="text-slate-400" />}
            </button>
            <button onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40"
              style={{ background: '#2563EB' }}>
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TriageBot;
