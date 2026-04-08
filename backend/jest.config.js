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
    // Analytics layer
    'src/analytics/**/*.js',
    // State machine + event bus (no Firebase dependency)
    'src/lib/BookingStateMachine.js',
    'src/lib/EventBus.js',
    'src/lib/states/**/*.js',
    // MVC — unit-testable pieces
    'src/mvc/MobilityDataMapper.js',
    'src/mvc/MobilityRequest.js',
    'src/mvc/MobilityResponse.js',
    'src/mvc/MobilityService.js',
    // Commands (all concrete command classes)
    'src/commands/ICommand.js',
    'src/commands/booking.commands.js',
    'src/commands/vehicle.commands.js',
    'src/commands/parking.commands.js',
    'src/commands/transit.commands.js',
    'src/commands/analytics.commands.js',
    'src/commands/provider.commands.js',
    // Services with no Firestore dependency
    'src/services/AvailabilityService.js',
    'src/services/PricingService.js',
    // Pricing strategies
    'src/strategies/**/*.js',
    // Pure error class
    'src/models/ApiError.js',
    // Excluded: firebaseAdmin.js, firestore.js, CommandRegistry.js,
    // MobilityController, MobilityPresenter, MobilityRequestHandler,
    // MobilityDataGateway, routes/, middleware/, controllers/, gateways/,
    // models/(Firestore), services/(Firestore-dependent), scripts/
  ],
  coverageDirectory: 'coverage',
};
