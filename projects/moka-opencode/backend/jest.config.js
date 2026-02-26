/**
 * Moka Interview System - Test Suite
 * Based on: https://github.com/goldbergyoni/javascript-testing-best-practices (24.6k ⭐)
 *
 * Testing Strategy:
 * - Unit Tests: Test individual functions/modules in isolation
 * - Integration Tests: Test API endpoints with database
 * - E2E Tests: Test complete user workflows
 *
 * Best Practices Applied:
 * 1. AAA Pattern (Arrange, Act, Assert)
 * 2. Black-box testing (test public behavior only)
 * 3. Realistic test data
 * 4. Descriptive test names (What-When-Expect)
 */

module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/test/**/*.test.ts", "!**/test/fixtures/**"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Transform TypeScript
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.module.ts",
    "!src/main.ts",
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Test timeout (10 seconds for API tests)
  testTimeout: 10000,

  // Verbose output
  verbose: true,
};
