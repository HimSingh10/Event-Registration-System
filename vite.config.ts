import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { processAiChat, processAiOrganizer } from './server/geminiHandler';

function geminiServerPlugin() {
  const attachMiddlewares = (server: any) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.method === 'POST' && req.url === '/api/gemini/chat') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const result = await processAiChat(payload);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'AI processing failed' }));
          }
        });
        return;
      }

      if (req.method === 'POST' && req.url === '/api/gemini/organizer') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const result = await processAiOrganizer(payload);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'AI organizer failed' }));
          }
        });
        return;
      }

      next();
    });
  };

  return {
    name: 'gemini-server-api',
    configureServer: attachMiddlewares,
    configurePreviewServer: attachMiddlewares,
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiServerPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});

