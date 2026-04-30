import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check with DB connection
router.get('/detailed', async (req, res) => {
  const checks = {
    database: false,
    memory: false,
    disk: false,
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Memory check (< 90% usage)
  const usedMemory = process.memoryUsage();
  const memoryUsagePercent = (usedMemory.heapUsed / usedMemory.heapTotal) * 100;
  checks.memory = memoryUsagePercent < 90;

  // Response time check
  const startTime = Date.now();
  
  const allHealthy = Object.values(checks).every(v => v);
  const responseTime = Date.now() - startTime;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    metrics: {
      responseTime: `${responseTime}ms`,
      memoryUsage: `${memoryUsagePercent.toFixed(2)}%`,
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Readiness check for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness check for Kubernetes
router.get('/live', (req, res) => {
  res.json({ alive: true });
});

export { router as healthRouter };
