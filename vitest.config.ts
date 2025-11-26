import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Include only unit and integration tests (exclude E2E/Playwright)
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/smoke-tests.test.ts'
    ],
    // Exclude Playwright and accessibility tests
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
      'tests/accessibility/**/*.spec.ts',
      '**/*.spec.ts' // Playwright uses .spec.ts
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'scripts/',
        'deploy-guaranteed.js',
        '**/*.spec.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@lib': path.resolve(__dirname, './lib'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  }
});
