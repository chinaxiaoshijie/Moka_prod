/**
 * Moka Interview System - Test Suite
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts", "!**/test/fixtures/**"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.module.ts",
    "!src/main.ts",
  ],
  testTimeout: 30000,
  verbose: true,
};
