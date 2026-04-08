/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  verbose: true,
  testTimeout: 10000,
  forceExit: true,
  // Redirect firebase-admin to our mock so no real SDK initialization happens
  moduleNameMapper: {
    '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin.js',
  },
  coverageReporters: ['lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'src/analytics/**/*.js',
    'src/lib/**/*.js',
    'src/mvc/MobilityDataMapper.js',
    'src/mvc/MobilityService.js',
    'src/services/AvailabilityService.js',
    'src/services/PricingService.js',
    'src/strategies/**/*.js',
    'src/models/ApiError.js',
    '!src/server.js',
  ],
  coverageDirectory: 'coverage',
};
