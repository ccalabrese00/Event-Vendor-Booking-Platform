# Backend-only Dockerfile for AWS deployment
FROM node:18-alpine

WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./
RUN echo "=== Package files copied ===" && ls -la

# Install all dependencies (including devDependencies for build)
RUN echo "=== Starting npm install ===" && npm install && echo "=== npm install completed ==="

# Copy prisma schema and generate client
COPY prisma/ ./prisma/
RUN echo "=== Prisma files copied ===" && ls -la prisma/
RUN echo "=== Starting prisma generate ===" && npx prisma generate && echo "=== prisma generate completed ==="

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN echo "=== Source files copied ===" && ls -la src/

# Build the application
RUN echo "=== Starting npm run build ===" && npm run build && echo "=== Build completed ==="

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3000

# Start the backend server
CMD ["node", "dist/index.js"]
