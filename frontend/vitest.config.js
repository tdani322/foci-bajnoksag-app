import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    // EZT A SORT ADTUK HOZZÁ:
    exclude: ['**/node_modules/**', '**/e2e/**'], 
  },
});