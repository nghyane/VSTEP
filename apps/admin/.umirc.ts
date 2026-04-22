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
    { path: '/vocab', component: 'vocab/index' },
    { path: '/vocab/:id', component: 'vocab/detail' },
    { path: '/grammar', component: 'grammar/index' },
    { path: '/grammar/:id', component: 'grammar/detail' },
    { path: '/exams', component: 'exams/index' },
    { path: '/exams/:id', component: 'exams/detail' },
    { path: '/practice/listening', component: 'practice/listening' },
    { path: '/practice/reading', component: 'practice/reading' },
    { path: '/practice/writing', component: 'practice/writing' },
    { path: '/practice/speaking-drills', component: 'practice/speaking-drills' },
    { path: '/practice/speaking-tasks', component: 'practice/speaking-tasks' },
    { path: '/users', component: 'users/index' },
    { path: '/courses', component: 'courses/index' },
    { path: '/courses/:id', component: 'courses/detail' },
    { path: '/promo', component: 'promo/index' },
    { path: '/settings', component: 'settings/index' },
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
});
