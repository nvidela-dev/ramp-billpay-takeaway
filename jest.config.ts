import type { Config } from 'jest';

const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^nuqs/server$': '<rootDir>/src/__tests__/__mocks__/nuqs-server.ts',
};

const config: Config = {
  passWithNoTests: true,
  projects: [
    {
      preset: 'ts-jest',
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      preset: 'ts-jest',
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      preset: 'ts-jest',
      displayName: 'components',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.ts?(x)'],
      moduleNameMapper,
    },
  ],
};

export default config;
