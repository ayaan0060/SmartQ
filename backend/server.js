const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  pingTimeout: 60000,
});

// Make io accessible in controllers via req.app.locals
app.locals.io = io;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));  // legacy
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ambulances', require('./routes/ambulanceRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartQ API is running', ts: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Status messages for socket relay
const statusMessages = {
  acknowledged: 'Hospital acknowledged your request. Dispatching ambulance...',
  dispatched:   'Ambulance is on the way!',
  en_route:     'Ambulance is en route to your location.',
  arriving:     'Ambulance is arriving — please come to the entrance.',
  arrived:      'Ambulance has arrived at your location.',
  completed:    'You have been assisted. Stay safe.',
  cancelled:    'Emergency request was cancelled.',
};

// ── Socket.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Patient joins their personal token room for direct notifications
  socket.on('join:token', (tokenId) => {
    if (tokenId) {
      socket.join(`token:${tokenId}`);
      console.log(`↳ Joined token room: ${tokenId}`);
    }
  });

  socket.on('joinHospital', (hospitalId) => {
    if (hospitalId) {
      socket.join(hospitalId.toString());
      // Also join the hospital: prefixed room used by emergency system
      socket.join(`hospital:${hospitalId}`);
      socket.emit('joined', { hospitalId });
      console.log(`↳ Joined hospital room: ${hospitalId}`);
    }
  });

  socket.on('leaveHospital', (hospitalId) => {
    if (hospitalId) {
      socket.leave(hospitalId.toString());
      socket.leave(`hospital:${hospitalId}`);
    }
  });

  // Emergency tracking rooms
  socket.on('join:emergency', (requestId) => {
    if (requestId) {
      socket.join(`emergency:${requestId}`);
      console.log(`↳ Joined emergency room: ${requestId}`);
    }
  });

  socket.on('join:ambulance', (ambulanceId) => {
    if (ambulanceId) {
      socket.join(`ambulance:${ambulanceId}`);
      console.log(`↳ Joined ambulance room: ${ambulanceId}`);
    }
  });

  socket.on('join:hospital', (hospitalId) => {
    if (hospitalId) {
      socket.join(`hospital:${hospitalId}`);
      console.log(`↳ Joined hospital: room: ${hospitalId}`);
    }
  });

  // ── Dispatch relay: driver status updates ──────────────────────────────────
  // Driver emits this when they tap En Route / Arriving / Arrived buttons.
  // Server relays to the patient's emergency room + admin hospital room.
  socket.on('dispatch:statusUpdate', ({ requestId, ambulanceId, status, hospitalId }) => {
    if (!requestId || !status) return;
    console.log(`↳ dispatch:statusUpdate  req=${requestId}  status=${status}`);
    // Relay to patient room
    io.to(`emergency:${requestId}`).emit('emergency:status:updated', {
      requestId,
      status,
      message: statusMessages[status] || status,
    });
    // Relay to admin room
    if (hospitalId) {
      io.to(`hospital:${hospitalId}`).emit('emergency:status:updated', { requestId, status });
    }
  });

  // ── Location bridge: relay ambulance GPS into patient emergency room ────────
  // When an ambulance is dispatched to a request, the server bridges
  // ambulance:location:updated events into the request's emergency room
  // so the patient map updates without joining the ambulance room directly.
  socket.on('dispatch:bridgeLocation', ({ requestId, ambulanceId }) => {
    if (!requestId || !ambulanceId) return;
    // Store the bridge mapping on the socket so we can relay on location updates
    if (!socket.locationBridges) socket.locationBridges = {};
    socket.locationBridges[ambulanceId] = requestId;
    console.log(`↳ Location bridge: amb=${ambulanceId} → req=${requestId}`);
  });

  // When driver emits their GPS location, relay it to bridged request rooms
  socket.on('ambulance:location', ({ ambulanceId, lat, lng, heading }) => {
    if (!ambulanceId) return;
    const payload = { ambulanceId, lat, lng, heading, updatedAt: new Date() };
    // Broadcast to ambulance room (existing admin tracking)
    io.to(`ambulance:${ambulanceId}`).emit('ambulance:location:updated', payload);
    // Also relay to any bridged patient emergency rooms
    io.sockets.sockets.forEach((s) => {
      if (s.locationBridges && s.locationBridges[ambulanceId]) {
        const reqId = s.locationBridges[ambulanceId];
        io.to(`emergency:${reqId}`).emit('ambulance:location:updated', payload);
      }
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket disconnected:', socket.id, reason);
  });
});

// ── Database ─────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set in .env'); process.exit(1); }
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB Error:', err); process.exit(1); });

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 SmartQ API running on port ${PORT}`);
});

module.exports = { app, io };
