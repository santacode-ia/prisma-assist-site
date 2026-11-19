import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [tailwindcss()], esbuild: { jsx: 'automatic' }, server: {
  proxy: { '/api/demo': 'http://127.0.0.1:5187' },
  // Never serve backend source, the session database, or private configuration.
  fs: { deny: ['.env', '.env.*', '**/.git/**', '**/server/**', '**/.local-demo/**', '**/.tools/**', '**/*.{crt,pem,key}'] }
} });
