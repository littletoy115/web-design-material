import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // the 3D viewer (three.js + react-three-fiber) is one lazy chunk of ~1 MB by nature
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Libraries change far less often than our code: separate chunks keep them cached
        // across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\/]/.test(id)) return 'react';
          // only the fitting room loads this one
          if (/[\/](three|three-stdlib|@react-three[\/][^\/]+|react-reconciler|its-fine|zustand|suspend-react)[\/]/.test(id)) return 'three';
          return undefined;
        },
      },
    },
  },
});
