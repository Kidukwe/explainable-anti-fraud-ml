import { defineConfig, loadEnv } from 'vite';
import { environmentPlugin, readEnvironment } from './config/environment.js';

export default defineConfig(({ mode }) => ({
  plugins: [
    environmentPlugin(
      readEnvironment(
        loadEnv(mode, process.cwd(), ['ENVIRONMENT', 'OPERATIONS_API_URL']),
      ),
    ),
  ],
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