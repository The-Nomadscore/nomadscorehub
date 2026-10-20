import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // vite.config.js, inside defineConfig({ ... })
build: {
  chunkSizeWarningLimit: 1000, // the lazy globe chunk (three.js) is intentionally large
},
  plugins: [react()],
  server: {
    port: 5173,
  },
});