/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native" +
      "|@react-native" +
      "|@react-navigation" +
      "|expo(nent)?" +
      "|expo-font" +
      "|expo-asset" +
      "|expo-modules-core" +
      "|@expo" +
      "|@expo-google-fonts" +
      "|unimodules" +
      "|@unimodules" +
      ")/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "^assets/(.*)$": "<rootDir>/assets/$1",
    "^react-native-keyboard-controller$": "<rootDir>/__mocks__/react-native-keyboard-controller.js"
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "json-summary"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/*.d.ts",
    "!**/theme/**",
    "!**/config/**",
    "!**/devtools/**",
  ],
}
