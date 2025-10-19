import 'reflect-metadata';

// Mock winston to avoid ES module issues
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  format: {
    combine: jest.fn((...args) => args),
    timestamp: jest.fn(),
    printf: jest.fn((fn) => fn),
    colorize: jest.fn(),
    simple: jest.fn(),
    json: jest.fn(),
    errors: jest.fn(),
    uncolorize: jest.fn(),
  },
}));

// Mock winston-loki
jest.mock('winston-loki', () => {
  return jest.fn().mockImplementation(() => ({}));
});