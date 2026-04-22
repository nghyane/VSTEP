import { defineConfig } from 'umi';

export default defineConfig({
  npmClient: 'npm',
  esbuildMinifyIIFE: true,
  links: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=vietnamese' },
  ],
  routes: [
    { path: '/login', component: 'login/index', layout: false },
    { path: '/', component: 'index' },
    { path: '/users', component: 'placeholder' },
    { path: '/courses', component: 'placeholder' },
    { path: '/exams', component: 'placeholder' },
    { path: '/vocab', component: 'placeholder' },
    { path: '/grammar', component: 'placeholder' },
    { path: '/practice/listening', component: 'placeholder' },
    { path: '/practice/reading', component: 'placeholder' },
    { path: '/practice/writing', component: 'placeholder' },
    { path: '/practice/speaking-drills', component: 'placeholder' },
    { path: '/practice/speaking-tasks', component: 'placeholder' },
    { path: '/settings', component: 'placeholder' },
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
});
