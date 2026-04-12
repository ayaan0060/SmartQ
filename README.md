# SmartQ — Hospital Queue Management Platform

SmartQ is a full-stack hospital queue management system that eliminates physical waiting lines. Patients join queues digitally, receive real-time position updates, book appointments, and request emergency ambulances — all from their phone. Hospital staff manage queues, doctors see their patient list live, and admins get full operational visibility from a single dashboard.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [User Roles & Access](#user-roles--access)
- [API Overview](#api-overview)
- [Real-Time Architecture](#real-time-architecture)
- [Smart Queue Engine](#smart-queue-engine)
- [Security](#security)
- [Deployment](#deployment)

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Framer Motion — page and queue animations
- Zustand — auth and hospital state
- TanStack Query — server state and caching
- React Hook Form + Zod — form validation
- Socket.IO Client — live queue updates
- React Leaflet — hospital maps
- Recharts — analytics charts
- Lucide React — icons

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO — real-time bidirectional events
- JSON Web Tokens — stateless auth
- bcryptjs — password hashing
- express-validator — input validation
- express-rate-limit — abuse protection

---

## Features

### Patient
- Register and log in with email or phone (OTP via Phone.Email)
- Browse and select hospitals by location
- Book appointments through a 5-step guided flow (Hospital → Department → Doctor → Date/Time → Confirm)
- Join service queues and get a digital token
- Live queue position, estimated wait time, and arrival suggestion
- Request emergency ambulance with real-time GPS tracking
- View token history and past appointments
- Cancel appointments and tokens

### Doctor
- Personal queue dashboard showing waiting and in-progress patients
- Mark consultations complete or skip patients
- View patient records and appointment schedule
- Availability toggle with automatic shift-end detection

### Receptionist
- Issue tokens manually at the counter
- Live queue management — call next, skip, complete
- Patient lookup and registration
- Appointment management

### Hospital Admin
- Full hospital dashboard with live stats
- Manage doctors, staff, services, and departments
- Approve/reject ambulance dispatch
- Configure queue settings (inactivity thresholds, etc.)
- View analytics — token counts, wait times, completion rates

### Super Admin
- Approve or reject hospital registrations
- View all hospitals, users, and system-wide stats
- Manage the entire platform

---

## Project Structure

```
SmartQ/
├── backend/
│   ├── controllers/        # Route handlers
│   │   ├── authController.js
│   │   ├── queueController.js
│   │   ├── appointmentController.js
│   │   ├── tokenController.js
│   │   ├── paymentController.js
│   │   ├── hospitalController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── emergencyController.js
│   │   ├── ambulanceController.js
│   │   ├── staffController.js
│   │   └── statsController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── rbacMiddleware.js     # Role-based access + tenant isolation
│   │   ├── validate.js           # Input validation chains
│   │   ├── validateHospital.js   # Hospital registration validation
│   │   └── errorMiddleware.js    # Centralized error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Hospital.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   ├── Token.js
│   │   ├── Appointment.js
│   │   ├── Payment.js
│   │   ├── Service.js
│   │   ├── ConsultationLog.js
│   │   ├── EmergencyRequest.js
│   │   └── Ambulance.js
│   ├── routes/             # Express routers
│   ├── utils/
│   │   ├── queueCalculator.js    # Smart queue engine
│   │   ├── logger.js             # Security & audit logger
│   │   ├── asyncHandler.js
│   │   └── apiResponse.js
│   ├── .env.example
│   └── server.js
│
└── frontend/
    └── src/
        ├── app/            # QueryProvider
        ├── components/     # Shared UI components
        ├── features/
        │   ├── auth/       # useAuthStore, AuthService, LoginForm
        │   └── hospital/   # useHospitalStore, HospitalService
        ├── layouts/        # PageLayout, AdminLayout, DoctorLayout, StaffLayout
        ├── pages/
        │   ├── admin/      # Admin panel pages
        │   ├── doctor/     # Doctor workspace pages
        │   ├── receptionist/
        │   ├── staff/
        │   ├── nurse/
        │   └── patient/
        ├── hooks/          # useGeolocation, useTheme, etc.
        ├── lib/
        │   ├── api.js      # Axios instance with interceptors
        │   └── socket.js   # Socket.IO client
        ├── store/          # queueStore
        └── App.jsx         # Route definitions
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smartq.git
cd smartq
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT secret (see Environment Variables)
npm install
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend runs on a different port
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5001`.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/smartq` |
| `JWT_SECRET` | 64-byte random hex string | Generate with command below |
| `JWT_EXPIRES_IN` | Token lifetime | `24h` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `200` |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per window | `20` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend — `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5001` |

---

## User Roles & Access

| Role | Description | Default Route After Login |
|---|---|---|
| `patient` | Books appointments, joins queues | `/patient/dashboard` |
| `doctor` | Manages their patient queue | `/doctor/dashboard` |
| `receptionist` | Issues tokens, manages counter | `/receptionist/dashboard` |
| `staff` | Queue and ward support | `/staff/dashboard` |
| `hospital-admin` | Full hospital management | `/admin` |
| `super-admin` | Platform-wide control | `/admin` |

### Creating accounts

- **Patients** — self-register at `/register`
- **Hospital admins** — register their hospital at `/register-hospital` (requires super-admin approval)
- **Doctors & receptionists** — created by hospital admin from the admin panel
- **Super admin** — seeded directly in the database

---

## API Overview

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a patient account |
| `POST` | `/auth/login` | Public | Log in, receive JWT |
| `GET` | `/auth/me` | JWT | Get current user |
| `PATCH` | `/auth/profile` | JWT | Update name/avatar |
| `GET` | `/hospitals` | Public | List active hospitals |
| `POST` | `/hospitals/register` | Public | Register hospital + admin |
| `GET` | `/queue/my-status` | Patient | Live queue position |
| `GET` | `/queue/display/:hospitalId` | Public | Display board data |
| `POST` | `/queue` | Staff | Add token to queue |
| `PATCH` | `/queue/:id` | Staff/Doctor | Update token status |
| `GET` | `/appointments/slots` | JWT | Available time slots |
| `POST` | `/appointments/book` | Patient | Book appointment |
| `GET` | `/appointments/my` | Patient | My appointments |
| `POST` | `/tokens/book` | Patient | Book a service token |
| `GET` | `/tokens/history` | Patient | My token history |
| `POST` | `/emergency/request` | Patient | Request ambulance |
| `GET` | `/emergency/requests/:id/track` | Patient/Staff | Track emergency |
| `POST` | `/payments/create-order` | JWT | Create payment order |
| `POST` | `/payments/confirm` | JWT | Confirm payment, book token |

---

## Real-Time Architecture

SmartQ uses Socket.IO rooms to push updates only to relevant clients — no polling overhead.

### Rooms

| Room | Joined by | Events received |
|---|---|---|
| `{hospitalId}` | All hospital staff | `queue:add`, `queue:update`, `queue:remove` |
| `hospital:{hospitalId}` | Admin, staff | `emergency:new`, `emergency:status:updated` |
| `token:{tokenId}` | Patient | `token:called`, `token:done` |
| `emergency:{requestId}` | Patient, staff | `emergency:dispatched`, `emergency:status:updated`, `ambulance:location:updated` |
| `ambulance:{ambulanceId}` | Admin | `ambulance:location:updated` |
| `dept:{hospitalId}:{serviceId}` | Patients in that dept | `queue:updated` (smart queue) |

### Key events

```
Client → Server
  joinHospital(hospitalId)
  join:department({ hospitalId, serviceId })
  join:emergency(requestId)
  ambulance:location({ ambulanceId, lat, lng })

Server → Client
  queue:updated       — smart queue recalculated
  token:called        — patient's turn
  emergency:dispatched — ambulance assigned
  ambulance:location:updated — GPS position
```

---

## Smart Queue Engine

The smart queue engine (`backend/utils/queueCalculator.js`) calculates real-time wait times using exponentially weighted rolling averages from actual consultation history.

### How it works

1. When a consultation completes, its duration is logged to `ConsultationLog`
2. `recalculateQueue()` fetches the last 10 logs for the doctor and computes an exponentially weighted moving average (EWMA) with `α = 0.3`
3. Each waiting patient's `estimatedWaitTime`, `predictedTurnTime`, and `arrivalSuggestion` are updated in a single `bulkWrite` operation
4. The updated queue is emitted via Socket.IO to the department room

### Triggers

Queue recalculation fires automatically after:
- A new token is added
- A consultation is marked complete
- A patient is skipped
- A token is cancelled or removed

### Fallback chain

```
Doctor rolling average (last 10 consultations)
  → Service default avgTime
    → Global default (15 minutes)
```

### Patient arrival suggestion

```
arrivalSuggestion = now + max(0, estimatedWaitTime - 15 minutes)
```

Patients are told to arrive 15 minutes before their predicted turn so they are present without waiting too long.

---

## Security

- **Passwords** hashed with bcrypt (12 rounds)
- **JWT** tokens expire in 24 hours; secrets must be 64-byte random hex
- **Rate limiting** — 200 req/15min globally, 20 req/15min on auth endpoints
- **Input validation** on every endpoint via `express-validator`
- **RBAC** — every route checks role before executing
- **Tenant isolation** — hospital staff can only access their own hospital's data
- **IDOR protection** — ownership verified before reading or modifying any resource
- **Mass assignment prevention** — controllers whitelist only safe fields, never spread `req.body`
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` (production)
- **No secrets in frontend** — all sensitive config is server-side only via `process.env`
- **Audit logging** — auth events, IDOR attempts, rate limit hits, and slow responses logged to stdout

---

## Deployment

### Backend (Render / Railway)

1. Push code to GitHub
2. Create a new Web Service pointing to the `backend/` directory
3. Set all environment variables from `backend/.env.example` in the dashboard
4. Set start command: `npm start`
5. In MongoDB Atlas, add the deployment IP to the network access allowlist

### Frontend (Vercel / Netlify)

1. Create a new project pointing to the `frontend/` directory
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `VITE_API_URL` → your backend URL (e.g. `https://smartq-api.onrender.com/api`)
   - `VITE_SOCKET_URL` → your backend URL (e.g. `https://smartq-api.onrender.com`)

### MongoDB Atlas

1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with a strong password
3. Add your deployment server's IP to Network Access (avoid `0.0.0.0/0` in production)
4. Copy the connection string into `MONGODB_URI`

### Production checklist

- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is a 64-byte random hex string (not the placeholder)
- [ ] `MONGODB_URI` uses a dedicated database user with minimum required permissions
- [ ] MongoDB network access is restricted to your server's IP
- [ ] `CLIENT_URL` is set to your exact frontend domain
- [ ] HTTPS is enforced at the hosting provider level
- [ ] `.env` is in `.gitignore` and never committed

---

## License

MIT
