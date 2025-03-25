import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globalTeardown: './tests/integration/globalTeardown.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
