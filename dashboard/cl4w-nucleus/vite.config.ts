import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  server: {
    port: 3031,
    proxy: {
      '/ws': { target: 'ws://localhost:3030', ws: true },
    },
  },
});
