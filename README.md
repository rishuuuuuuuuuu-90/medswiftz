# MediSwiftzzz 💊

A production-ready medicine delivery platform — prescription upload → pharmacist verification → doorstep delivery with live tracking.

## Features

- 🔐 **JWT Authentication** — access + refresh tokens, role-based access control
- 👤 **3 User Roles** — Patient, Pharmacist/Admin, Delivery Partner
- 📋 **Prescription Management** — upload, review, approve/reject with audit trail
- 🛒 **Shopping Cart** — OTC + Rx medicines with stock validation
- 📦 **Order Lifecycle** — `PRESCRIPTION_UPLOADED → VERIFIED → PACKED → OUT_FOR_DELIVERY → DELIVERED`
- 🔴 **Live Tracking** — Socket.IO real-time order status updates
- 💳 **Payments** — Razorpay (online) + Cash on Delivery
- 🚚 **Delivery OTP** — 6-digit OTP verification at handover
- 📊 **Admin Dashboard** — metrics, prescription review, stock management

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| Realtime | Socket.IO |
| File Upload | Cloudinary |
| Payments | Razorpay |
| State | Zustand + TanStack React Query |

## Project Structure

```
mediswiftzzz/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── routes/         # API routes
│   │   │   ├── middleware/     # Auth, error, validation
│   │   │   ├── utils/          # Prisma, logger, cloudinary
│   │   │   ├── socket.ts       # Socket.IO setup
│   │   │   └── app.ts          # Express app
│   │   └── prisma/
│   │       ├── schema.prisma   # Database schema
│   │       └── seed.ts         # Seed data
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # UI components
│           ├── store/          # Zustand stores
│           ├── hooks/          # Custom hooks
│           └── lib/            # API client, utils
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared ESLint/tsconfig
└── docker-compose.yml
```

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm 10+

### 1. Clone and install

```bash
git clone <repo-url>
cd mediswiftzzz
npm install
```

### 2. Configure environment

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# Frontend
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your values
```

Minimum required in `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mediswiftzzz"
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Set up database

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Start development servers

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev --workspace=apps/api   # http://localhost:5000
npm run dev --workspace=apps/web   # http://localhost:3000
```

## Docker Setup

```bash
# Start all services (PostgreSQL + API + Web)
docker-compose up -d

# Run migrations inside container
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api node -e "require('./prisma/seed')"

# Stop all services
docker-compose down
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@mediswiftzzz.com | Patient@123 |
| Pharmacist | pharmacist@mediswiftzzz.com | Pharm@123 |
| Admin | admin@mediswiftzzz.com | Admin@123 |
| Delivery Partner | delivery@mediswiftzzz.com | Delivery@123 |

## API Documentation

Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |

### Prescriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/prescriptions/upload` | Patient | Upload prescription |
| GET | `/prescriptions/my` | Patient | Get my prescriptions |
| GET | `/prescriptions/pending` | Pharmacist/Admin | Get pending Rx |
| POST | `/prescriptions/:id/review` | Pharmacist/Admin | Approve/reject Rx |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Patient | Place order |
| GET | `/orders/my` | Patient | Get my orders |
| GET | `/orders/:id` | Patient/Staff | Get order details |
| PUT | `/orders/:id/status` | Admin/Pharmacist | Update order status |

### Delivery
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/delivery/my` | Delivery Partner | Get my deliveries |
| POST | `/delivery/assign` | Admin | Assign delivery |
| PUT | `/delivery/:id/status` | Delivery Partner | Update status |
| POST | `/delivery/:id/verify-otp` | Delivery Partner | Verify OTP |

## Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:room` | Client → Server | `"order:{orderId}"` |
| `order:status:update` | Server → Client | `{ orderId, status, timestamp }` |
| `delivery:location:update` | Both | `{ orderId, lat, lng }` |

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Backend → Render/Railway

1. Connect GitHub repo
2. Set build command: `npm run build --workspace=apps/api`
3. Set start command: `npm run start --workspace=apps/api`
4. Set all environment variables from `apps/api/.env.example`

### Database → Neon/Supabase

1. Create a PostgreSQL database
2. Copy connection string to `DATABASE_URL`
3. Run `npx prisma migrate deploy` on first deploy

## Next Steps (Production Hardening)

1. **Security**
   - Add HTTPS/TLS termination
   - Implement Redis for rate limiting (distributed)
   - Add request signing for Cloudinary webhooks
   - Set up CSP headers

2. **Scalability**
   - Add Redis for Socket.IO adapter (multiple server instances)
   - Implement database connection pooling (PgBouncer)
   - Add CDN for static assets

3. **Monitoring**
   - Integrate Sentry for error tracking
   - Set up Prometheus + Grafana metrics
   - Add structured logging to CloudWatch/Datadog

4. **Features**
   - Push notifications (Firebase FCM)
   - SMS OTP via Twilio/MSG91
   - Google Maps route preview for delivery
   - PDF invoice generation
   - Repeat order functionality
   - Medicine reminders

5. **Testing**
   - Add E2E tests with Playwright
   - Add integration tests for order flow
   - Add load testing with k6

6. **Compliance**
   - GDPR-compliant data handling
   - Prescription storage encryption at rest
   - Audit trail export for regulatory compliance
