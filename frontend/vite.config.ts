/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const DEV_SERVER_PORT = 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEV_SERVER_PORT,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
