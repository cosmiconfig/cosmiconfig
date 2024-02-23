import { defineConfig } from 'vitest/config';

const vitestConfig = defineConfig({
  test: {
    threads: false,
    environment: 'node',
    restoreMocks: true,
    mockReset: true,
    include: ['packages/*/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    includeSource: ['packages/*/src/**/*.{js,ts}'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/*/src/**/*.{js,ts}'],
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});

// eslint-disable-next-line import/no-default-export
export default vitestConfig;
