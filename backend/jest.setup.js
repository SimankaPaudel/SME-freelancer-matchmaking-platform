// Set test environment variable before tests run
process.env.NODE_ENV = 'test';

// CRITICAL: Force test database to prevent production data deletion
// This MUST be set BEFORE any mongoose connections are made
process.env.MONGODB_URI = 'mongodb://localhost:27017/fyp_test';

// Verify we're using the test database
if (process.env.MONGODB_URI !== 'mongodb://localhost:27017/fyp_test') {
  throw new Error('FATAL: Jest is not configured to use test database! Tests will not run.');
}

// Set increased timeout for database operations
jest.setTimeout(10000);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
