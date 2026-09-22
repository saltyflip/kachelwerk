/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Der base-Pfad unterscheidet sich je Ziel:
//   GitHub Pages -> "/kachelwerk/" (via npm run build:pages)
//   Vercel / lokal -> "/"
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { TZ: 'Europe/Vienna' },
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
