# Backend-only Dockerfile for faster deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy backend source and build
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3000

# Start the backend server
CMD ["node", "dist/index.js"]
