import type { Context } from 'hono';
import type { Env, Config } from '../types';
import { StorageService } from '../services/storage';
import { MetadataService } from '../services/metadata';
import { successResponse, errorResponse } from '../utils/response';

// Default configuration
const DEFAULT_CONFIG: Config = {
  maxUploadCount: 20,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif'],
  imageQuality: 80
};

// POST /api/validate-api-key - Validate API key
export async function validateApiKeyHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  // If we reach here, the API key is already validated by middleware
  return successResponse({ valid: true });
}

// GET /api/config - Get configuration
export async function configHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Try to get custom config from KV
    const configData = await c.env.KV.get('config');
    const config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;

    return successResponse({ config });

  } catch (err) {
    console.error('Config handler error:', err);
    return successResponse({ config: DEFAULT_CONFIG });
  }
}

// POST /api/cleanup - Clean up expired images
export async function cleanupHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const metadata = new MetadataService(c.env.KV);
    const storage = new StorageService(c.env.R2_BUCKET);

    // Get expired images
    const expiredImages = await metadata.getExpiredImages();

    let deletedCount = 0;

    for (const image of expiredImages) {
      try {
        // Delete files from R2
        const keysToDelete = [image.paths.original];
        if (image.paths.webp) keysToDelete.push(image.paths.webp);
        if (image.paths.avif) keysToDelete.push(image.paths.avif);

        await storage.deleteMany(keysToDelete);

        // Delete metadata
        await metadata.deleteImage(image.id);

        deletedCount++;
      } catch (err) {
        console.error('Failed to delete expired image:', image.id, err);
      }
    }

    return successResponse({ deletedCount });

  } catch (err) {
    console.error('Cleanup handler error:', err);
    return errorResponse('Cleanup failed');
  }
}
