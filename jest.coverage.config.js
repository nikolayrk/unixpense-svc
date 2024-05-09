var config = require('./jest.config')

config = {
    ...config,
    testPathIgnorePatterns: [ "/__tests__/integration/integration\\.test\\.base\\.ts$" ],
    globalSetup: './jest.coverage.globalSetup.ts',
    globalTeardown: './jest.coverage.globalTeardown.ts',
};

module.exports = config