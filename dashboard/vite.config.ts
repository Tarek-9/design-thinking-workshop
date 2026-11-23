/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Same-origin in development: the sign-in cookie is `SameSite=Strict` and would
// not be sent to another origin.
const API_TARGET = 'http://localhost:8080';

const DEV_SERVER_PORT = 5174;
const STREAM_PROXY_TIMEOUT_MS = 3_600_000;
const PROXY_TIMEOUT_MS = 30_000;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
  server: {
    port: DEV_SERVER_PORT,
    // Same routes as nginx in production. `changeOrigin` stays off: nginx passes
    // the browser's `Host` through, and so does Vite by default.
    proxy: {
      // Listed before `/api`, since Vite takes the first matching key. The timeout
      // matches nginx's `proxy_read_timeout` (one hour), so an idle stream is not cut.
      '/api/v1/staff/events': {
        target: API_TARGET,
        proxyTimeout: STREAM_PROXY_TIMEOUT_MS,
      },
      '/api': {
        target: API_TARGET,
        proxyTimeout: PROXY_TIMEOUT_MS,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
