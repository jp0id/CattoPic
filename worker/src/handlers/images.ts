import type { Context } from 'hono';
import type { Env } from '../types';
import { StorageService } from '../services/storage';
import { MetadataService } from '../services/metadata';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { parseNumber, validateOrientation, parseTags, isValidUUID } from '../utils/validation';

// GET /api/images - List images with pagination and filters
export async function imagesHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const url = new URL(c.req.url);
    const page = parseNumber(url.searchParams.get('page'), 1);
    const limit = parseNumber(url.searchParams.get('limit'), 12);
    const tag = url.searchParams.get('tag') || undefined;
    const orientation = validateOrientation(url.searchParams.get('orientation'));

    const metadata = new MetadataService(c.env.DB);
    const { images, total } = await metadata.getImages({ page, limit, tag, orientation });

    const workerUrl = new URL(c.req.url).origin;
    const baseUrl = `${workerUrl}/r2`;

    // Add full URLs to images
    const imagesWithUrls = images.map(img => ({
      ...img,
      urls: {
        original: `${baseUrl}/${img.paths.original}`,
        webp: img.paths.webp ? `${baseUrl}/${img.paths.webp}` : '',
        avif: img.paths.avif ? `${baseUrl}/${img.paths.avif}` : ''
      }
    }));

    return successResponse({
      images: imagesWithUrls,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('Images handler error:', err);
    return errorResponse('Failed to fetch images');
  }
}

// GET /api/images/:id - Get single image details
export async function imageDetailHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const id = c.req.param('id');

    if (!isValidUUID(id)) {
      return errorResponse('Invalid image ID');
    }

    const metadata = new MetadataService(c.env.DB);
    const image = await metadata.getImage(id);

    if (!image) {
      return notFoundResponse('Image not found');
    }

    const workerUrl = new URL(c.req.url).origin;
    const baseUrl = `${workerUrl}/r2`;

    return successResponse({
      image: {
        ...image,
        urls: {
          original: `${baseUrl}/${image.paths.original}`,
          webp: image.paths.webp ? `${baseUrl}/${image.paths.webp}` : '',
          avif: image.paths.avif ? `${baseUrl}/${image.paths.avif}` : ''
        }
      }
    });

  } catch (err) {
    console.error('Image detail handler error:', err);
    return errorResponse('Failed to fetch image');
  }
}

// PUT /api/images/:id - Update image metadata
export async function updateImageHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const id = c.req.param('id');

    if (!isValidUUID(id)) {
      return errorResponse('Invalid image ID');
    }

    const body = await c.req.json();
    const metadata = new MetadataService(c.env.DB);

    // Build updates object
    const updates: Record<string, string[] | string | undefined> = {};

    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags) ? body.tags : parseTags(body.tags);
    }

    if (body.expiryMinutes !== undefined) {
      if (body.expiryMinutes > 0) {
        const expiry = new Date(Date.now() + body.expiryMinutes * 60 * 1000);
        updates.expiryTime = expiry.toISOString();
      } else {
        updates.expiryTime = undefined;
      }
    }

    const updated = await metadata.updateImage(id, updates);

    if (!updated) {
      return notFoundResponse('Image not found');
    }

    const workerUrl = new URL(c.req.url).origin;
    const baseUrl = `${workerUrl}/r2`;

    return successResponse({
      image: {
        ...updated,
        urls: {
          original: `${baseUrl}/${updated.paths.original}`,
          webp: updated.paths.webp ? `${baseUrl}/${updated.paths.webp}` : '',
          avif: updated.paths.avif ? `${baseUrl}/${updated.paths.avif}` : ''
        }
      }
    });

  } catch (err) {
    console.error('Update image handler error:', err);
    return errorResponse('Failed to update image');
  }
}

// DELETE /api/images/:id - Delete image
export async function deleteImageHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const id = c.req.param('id');

    if (!isValidUUID(id)) {
      return errorResponse('Invalid image ID');
    }

    const metadataService = new MetadataService(c.env.DB);
    const image = await metadataService.getImage(id);

    if (!image) {
      return notFoundResponse('Image not found');
    }

    // Delete files from R2
    const storage = new StorageService(c.env.R2_BUCKET);
    const keysToDelete = [image.paths.original];

    if (image.paths.webp) keysToDelete.push(image.paths.webp);
    if (image.paths.avif) keysToDelete.push(image.paths.avif);

    await storage.deleteMany(keysToDelete);

    // Delete metadata
    await metadataService.deleteImage(id);

    return successResponse({ message: 'Image deleted' });

  } catch (err) {
    console.error('Delete image handler error:', err);
    return errorResponse('Failed to delete image');
  }
}
