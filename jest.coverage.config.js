require('./jest.coverage.setup.js');

var config = require('./jest.config');

config = {
    ...config,
    testPathIgnorePatterns: ["/__tests__/e2e/", "/database/migrations/"],
    testMatch: [
        "**/src/**/*.test.ts",
        "**/__tests__/integration/**/*.js",
        "**/__tests__/integration/**/*.ts"
    ],
    setupFiles: ['./jest.coverage.setup.js'],
    globalSetup: './jest.coverage.globalSetup.ts',
    globalTeardown: './jest.coverage.globalTeardown.ts',
};

module.exports = config
