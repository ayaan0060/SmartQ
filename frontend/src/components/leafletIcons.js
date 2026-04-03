import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix broken default icons in Vite/React ──────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// ── Custom emoji DivIcons ────────────────────────────────────
const makeIcon = (emoji, bg, pulse = false) =>
  new L.DivIcon({
    html: `<div style="
      background:${bg};width:40px;height:40px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:20px;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      ${pulse ? 'animation:mapPulse 1.5s ease-in-out infinite;' : ''}
    ">${emoji}</div>`,
    className: '',
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
    popupAnchor:[0, -22],
  });

export const ambulanceIcon = makeIcon('🚑', '#DC2626', true);
export const hospitalIcon  = makeIcon('🏥', '#2563EB');
export const patientIcon   = makeIcon('📍', '#16A34A');
export const availableIcon = makeIcon('🚑', '#16A34A');
export const offlineIcon   = makeIcon('🚑', '#64748B');
