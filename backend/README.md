# Event Vendor Booking Platform - Backend

## Setup Instructions

### 1. Install PostgreSQL
Download and install PostgreSQL from https://www.postgresql.org/download/

Or use Docker:
```bash
docker run -d \
  --name event-vendor-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=event_vendor_booking \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

Example `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/event_vendor_booking?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 4. Run Server
```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Bookings (Vendor only)
- `GET /api/bookings` - List vendor bookings
- `POST /api/bookings` - Create new booking (public)
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/payment` - Update payment status

### Dashboard (Vendor only)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/revenue` - Revenue chart data

### Customer (Public)
- `GET /api/customer?email=xxx` - Get customer bookings
- `GET /api/customer/:id?email=xxx` - Get specific booking

### Activity (Vendor only)
- `GET /api/activity/recent` - Recent activity
- `GET /api/activity/booking/:id` - Booking activity log

### Vendor
- `GET /api/vendor/profile` - Get vendor profile
- `PUT /api/vendor/profile` - Update vendor profile
- `GET /api/vendor/search` - Search vendors (public)
- `GET /api/vendor/:id/profile` - Get vendor by ID (public)

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure
```
src/
├── index.ts           # Server entry point
├── middleware/
│   └── auth.ts        # JWT authentication
├── routes/
│   ├── auth.ts        # Auth endpoints
│   ├── bookings.ts    # Booking endpoints
│   ├── customer.ts    # Customer endpoints
│   ├── dashboard.ts   # Dashboard endpoints
│   ├── activity.ts    # Activity endpoints
│   └── vendor.ts      # Vendor endpoints
└── utils/
    └── prisma.ts      # Prisma client
```
