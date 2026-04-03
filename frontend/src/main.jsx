import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Clear stale auth storage if app version changed (e.g. JWT secret rotated)
const APP_VERSION = '2';
if (localStorage.getItem('smartq-app-version') !== APP_VERSION) {
  localStorage.removeItem('smartq-auth-storage');
  localStorage.removeItem('smartq-hospital-storage');
  localStorage.removeItem('token');
  localStorage.setItem('smartq-app-version', APP_VERSION);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
