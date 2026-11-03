import { defineConfig } from 'vite';
import { environmentPlugin, readEnvironment } from './config/environment.js';

export default defineConfig(() => ({
  plugins: [environmentPlugin(readEnvironment())],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
      },
    },
  },

  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
      },
    },
  },
}));
