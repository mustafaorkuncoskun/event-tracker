# Event Tracker

A full-stack event attendance management system built for corporate use. Employees receive personalized QR codes or 9-digit codes before the event — no app installation required. Door staff scan or enter codes via a mobile app or browser PWA, and organizers monitor real-time attendance on a live dashboard.

---

## Features

- **Unique invitations** — each employee gets a UUID-based QR code and a random 9-digit numeric code
- **Multi-channel check-in** — QR scan, manual code entry, or OCR from printed badge
- **Real-time dashboard** — live check-in feed and attendance rate via WebSocket
- **Event-scoped validation** — codes from one event are rejected at another
- **PDF invitations** — per-employee PDF with QR code, event details, and entry code
- **Staff authentication** — 4-digit PIN login, no account creation needed
- **Duplicate prevention** — database-level unique constraint blocks double check-ins

---

## Architecture

```
┌─────────────────────────────────────┐
│           Admin Panel               │  Manage employees, events,
│           React + Vite              │  invitations · Live dashboard
└──────────────┬──────────────────────┘
               │
               │  REST API + WebSocket (Socket.io)
               │
┌──────────────▼──────────────────────┐
│           Backend API               │  Fastify + Prisma
│           Node.js + TypeScript      │  PostgreSQL
└──────────┬───────────────┬──────────┘
           │               │
┌──────────▼──────┐ ┌──────▼──────────┐
│  Staff Web      │ │  Staff Mobile   │
│  React PWA      │ │  React Native   │
│  (any browser)  │ │  (Android/iOS)  │
└─────────────────┘ └─────────────────┘
```

---

## Tech Stack

### Backend
| | |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Fastify |
| ORM | Prisma |
| Database | PostgreSQL |
| Real-time | Socket.io |
| PDF | PDFKit + Roboto TTF |
| QR | qrcode |

### Frontend
| | |
|---|---|
| Admin Panel | React + Vite + TypeScript |
| Staff Web | React + Vite (PWA) |
| Staff Mobile | React Native (bare workflow) |
| QR Scanning (web) | @zxing/browser |
| QR Scanning (mobile) | react-native-vision-camera |
| OCR | Tesseract.js (web) · ML Kit (mobile) |
| Icons | Lucide React / Lucide React Native |

---

## Project Structure

```
event-tracker/
├── apps/
│   ├── api/                  # Fastify REST API
│   │   ├── src/
│   │   │   ├── routes/       # employees, events, invitations, checkins, staff
│   │   │   ├── lib/          # QR PDF generation, code generator
│   │   │   └── plugins/      # Prisma plugin
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   ├── admin/                # Organizer dashboard
│   │   └── src/
│   │       └── pages/        # Events, Employees, Staff, EventDetail
│   │
│   ├── staff-web/            # Door staff PWA
│   │   └── src/
│   │       └── pages/        # Login, EventSelect, Scanner
│   │
│   └── staff-mobile/         # Door staff native app
│       └── src/
│           └── screens/      # LoginScreen, EventSelectScreen, ScannerScreen
│
└── packages/
    └── shared/               # Shared TypeScript types (API contract)
```

---

## Data Model

```
Employee ──── Invitation ──── Event
                  │
               CheckIn ──── StaffUser
```

- An `Employee` can be invited to multiple events
- Each `Invitation` generates a unique `token` (UUID for QR) and `code` (9-digit numeric)
- A `CheckIn` record is created once per invitation — enforced by a unique constraint
- `StaffUser` authenticates via 4-digit PIN and is recorded on each check-in

---

## User Flows

**Organizer**
1. Create an event
2. Invite all employees — unique codes are generated automatically
3. Download per-employee PDF invitations
4. Monitor attendance live on the dashboard

**Door Staff**
1. Log in with 4-digit PIN
2. Select the event they're managing
3. Scan QR code, enter 9-digit code manually, or use OCR on printed badge
4. Instant visual + vibration feedback on success, duplicate, or invalid code

**Employee**
- Receives a PDF with their unique QR code and numeric code
- Presents it at the door — no app, no account, no friction

---

## Running Locally

**Prerequisites:** Node.js 20+, Docker

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d

# Set up database
cd apps/api && npx prisma migrate dev

# Start all services
npm run dev              # API (port 3001)
npm run dev --workspace=apps/admin       # Admin panel (port 5173)
npm run dev --workspace=apps/staff-web   # Staff PWA (port 5174)
```

**Environment variables** (`apps/api/.env`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/eventtracker
PORT=3001
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/staff/login` | Staff PIN authentication |
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create event |
| `GET` | `/api/events/:id/dashboard` | Attendance stats |
| `GET` | `/api/events/:id/invitations` | Invitation list with check-in status |
| `POST` | `/api/events/:id/invitations/all` | Generate invitations for all employees |
| `GET` | `/api/invitations/:id/pdf` | Download invitation PDF |
| `POST` | `/api/checkin` | Process a check-in |
| `GET` | `/api/employees` | List employees |
| `POST` | `/api/employees/import` | Bulk import via CSV |
