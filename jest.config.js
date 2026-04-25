module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  detectOpenHandles: true,
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.js"],
  collectCoverageFrom: [
    "backend/services/AuthService.js",
    "backend/services/QRCodeService.js",
    "backend/services/TokenService.js",
    "backend/services/RiskEngineService.js",
    "backend/services/HealthScoreService.js",
    "backend/services/AnalyticsService.js",
    "backend/utils/Validator.js",
    "backend/utils/Validators.js",
    "backend/utils/DateUtils.js"
  ]
};
