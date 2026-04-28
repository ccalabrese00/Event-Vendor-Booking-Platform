import request from 'supertest';
import express from 'express';
import { healthRouter } from '../routes/health';

const app = express();
app.use(express.json());
app.use('/api/health', healthRouter);

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return alive status for liveness probe', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('alive', true);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should check database connection for readiness', async () => {
      const response = await request(app)
        .get('/api/health/ready');

      // Should return either 200 or 503 depending on DB state
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('ready');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health metrics', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.metrics).toHaveProperty('responseTime');
      expect(response.body.metrics).toHaveProperty('memoryUsage');
      expect(response.body.metrics).toHaveProperty('uptime');
    });
  });
});
