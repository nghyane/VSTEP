// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://docs.vstep.local',
  base: '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
