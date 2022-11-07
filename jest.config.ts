import {JestConfigWithTsJest} from 'ts-jest'

const JestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\.ts$': ['ts-jest', {tsconfig: '<rootDir>/tests/tsconfig.json'}]
  },
  testTimeout: 1000000,
  testMatch: ['**/tests/**/*.test.ts']
}

export default JestConfig