import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: the API runs separately (npm --prefix server run dev).
    proxy: { '/api': 'http://localhost:8787' },
  },
});
