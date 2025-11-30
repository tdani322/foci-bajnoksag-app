import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Backendhez nem kell böngésző környezet (jsdom), elég a node
    environment: 'node', 
    globals: true,
    testTimeout: 10000,
  },
});