// Jest setup file
// Runs before all tests
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://lifeline:lifeline_dev_password@localhost:5433/lifeline_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB = '1'; // Use DB 1 for tests
// Increase timeout for integration tests
jest.setTimeout(10000);
// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
};
