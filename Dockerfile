# Backend API Dockerfile for ECS
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
COPY backend/lib/ ./lib/
COPY backend/prisma/ ./prisma/
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./
COPY backend/jest.config.js ./

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
