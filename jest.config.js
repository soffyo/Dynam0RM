/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\.ts$': ['ts-jest', {tsconfig: '<rootDir>/tests/tsconfig.json'}]
  }
}