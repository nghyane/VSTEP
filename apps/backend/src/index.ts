import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { submissionRoutes } from './routes/submissions';

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'VSTEP API',
        version: '1.0.0',
        description: 'Adaptive VSTEP Learning System',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
  }))
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  .use(submissionRoutes)
  .listen(3000);

console.log('🦊 VSTEP API at http://localhost:3000');
console.log('📚 OpenAPI at http://localhost:3000/swagger');
console.log('📖 OpenAPI JSON at http://localhost:3000/swagger/json');

export type App = typeof app;
