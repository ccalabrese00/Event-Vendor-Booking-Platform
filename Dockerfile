# Backend-only Dockerfile for AWS deployment
FROM node:18-alpine

WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build the application
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3000

# Start the backend server
CMD ["node", "dist/index.js"]
