import { prisma } from '../utils/prisma';

beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up test data
  // Add cleanup logic here as needed
});
