import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 20000, // mongodb-memory-server can take a moment to spin up on first run
    hookTimeout: 30000,
  },
});
