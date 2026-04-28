# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --only=production

# Build stage
FROM base AS builder
COPY . .
RUN npm ci
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production

# Create logs directory
RUN mkdir -p /app/logs

# Copy built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY package*.json ./

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app/logs
USER nextjs

EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start both frontend and backend
CMD ["sh", "-c", "npm run start:backend & npm run start:frontend"]
