<<<<<<< HEAD
# Backend API Dockerfile for ECS
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
COPY backend/lib/ ./lib/
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./
COPY backend/jest.config.js ./
COPY prisma/ ./prisma/

# Install dependencies and build
RUN npm ci
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
ENV NODE_ENV=production

WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy built application
COPY --from=base /app/package*.json ./
COPY --from=base /app/dist ./dist
COPY --from=base /app/lib ./lib
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN chown -R nodejs:nodejs /app/logs /app
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start backend
CMD ["node", "dist/index.js"]
=======
# Multi-stage build for Event Vendor Booking Platform
# This builds both frontend and backend into a single container

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY prisma/ ../prisma/
COPY backend/ ./
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install dependencies for both frontend and backend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/prisma ../prisma/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./dev.db"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Expose port
EXPOSE 3000

# Start the backend server
CMD ["node", "backend/dist/index.js"]
>>>>>>> 3f8a844 (Complete backend API implementation with AWS deployment setup)
