import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { AuthService } from './services/auth';
import { corsResponse, unauthorizedResponse } from './utils/response';

// Import handlers
import { uploadHandler } from './handlers/upload';
import { imagesHandler, imageDetailHandler, updateImageHandler, deleteImageHandler } from './handlers/images';
import { randomHandler } from './handlers/random';
import { tagsHandler, createTagHandler, renameTagHandler, deleteTagHandler, batchTagsHandler } from './handlers/tags';
import { validateApiKeyHandler, configHandler, cleanupHandler } from './handlers/system';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Handle preflight requests
app.options('*', (c) => corsResponse());

// Auth middleware for protected routes
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = AuthService.extractApiKey(authHeader);

  if (!apiKey) {
    return unauthorizedResponse();
  }

  const authService = new AuthService(c.env.KV);
  const isValid = await authService.validateApiKey(apiKey);

  if (!isValid) {
    return unauthorizedResponse();
  }

  await next();
};

// === Public Routes ===

// Random image (public, no auth required)
app.get('/api/random', randomHandler);

// Serve R2 files (public)
app.get('/r2/*', async (c) => {
  const path = c.req.path.replace('/r2/', '');

  if (!path) {
    return c.json({ success: false, error: 'Path required' }, 400);
  }

  const object = await c.env.R2_BUCKET.get(path);

  if (!object) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
});

// === Protected Routes ===

// Auth
app.post('/api/validate-api-key', authMiddleware, validateApiKeyHandler);

// Upload
app.post('/api/upload', authMiddleware, uploadHandler);

// Images CRUD
app.get('/api/images', authMiddleware, imagesHandler);
app.get('/api/images/:id', authMiddleware, imageDetailHandler);
app.put('/api/images/:id', authMiddleware, updateImageHandler);
app.delete('/api/images/:id', authMiddleware, deleteImageHandler);

// Tags CRUD
app.get('/api/tags', authMiddleware, tagsHandler);
app.post('/api/tags', authMiddleware, createTagHandler);
app.put('/api/tags/:name', authMiddleware, renameTagHandler);
app.delete('/api/tags/:name', authMiddleware, deleteTagHandler);
app.post('/api/tags/batch', authMiddleware, batchTagsHandler);

// System
app.get('/api/config', authMiddleware, configHandler);
app.post('/api/cleanup', authMiddleware, cleanupHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;
