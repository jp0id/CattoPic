import type { Context } from 'hono';
import type { Env } from '../types';
import { StorageService } from '../services/storage';
import { MetadataService } from '../services/metadata';
import { ImageProcessor } from '../services/imageProcessor';
import { errorResponse, imageResponse } from '../utils/response';
import { parseTags, isMobileDevice, getBestFormat } from '../utils/validation';

// GET /api/random - Get random image (PUBLIC - no auth required)
export async function randomHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const url = new URL(c.req.url);

    // Parse query parameters
    const tagsParam = url.searchParams.get('tags');
    const excludeParam = url.searchParams.get('exclude');
    const orientationParam = url.searchParams.get('orientation');
    const formatParam = url.searchParams.get('format');

    const tags = parseTags(tagsParam);
    const exclude = parseTags(excludeParam);

    // Determine orientation
    let orientation: string | undefined;
    if (orientationParam === 'landscape' || orientationParam === 'portrait') {
      orientation = orientationParam;
    } else if (orientationParam === 'auto') {
      // Auto-detect based on user agent
      const userAgent = c.req.header('User-Agent');
      orientation = isMobileDevice(userAgent) ? 'portrait' : 'landscape';
    }

    // Get random image metadata
    const metadata = new MetadataService(c.env.KV);
    const image = await metadata.getRandomImage({
      tags: tags.length > 0 ? tags : undefined,
      exclude: exclude.length > 0 ? exclude : undefined,
      orientation
    });

    if (!image) {
      return errorResponse('No images found matching criteria', 404);
    }

    // Determine format to serve
    let path: string;
    let contentType: string;

    if (image.format === 'gif') {
      // Always serve original for GIF
      path = image.paths.original;
      contentType = 'image/gif';
    } else {
      // Determine best format based on Accept header or explicit format param
      let format: 'original' | 'webp' | 'avif';

      if (formatParam === 'webp' || formatParam === 'avif' || formatParam === 'original') {
        format = formatParam;
      } else {
        const acceptHeader = c.req.header('Accept');
        format = getBestFormat(acceptHeader);
      }

      switch (format) {
        case 'avif':
          path = image.paths.avif || image.paths.original;
          contentType = image.paths.avif ? 'image/avif' : ImageProcessor.getContentType(image.format);
          break;
        case 'webp':
          path = image.paths.webp || image.paths.original;
          contentType = image.paths.webp ? 'image/webp' : ImageProcessor.getContentType(image.format);
          break;
        default:
          path = image.paths.original;
          contentType = ImageProcessor.getContentType(image.format);
      }
    }

    // Fetch image from R2
    const storage = new StorageService(c.env.R2_BUCKET);
    const file = await storage.get(path);

    if (!file) {
      return errorResponse('Image file not found', 404);
    }

    const data = await file.arrayBuffer();

    // Return image with no-cache to ensure randomness
    return imageResponse(data, contentType, 'no-cache, no-store, must-revalidate');

  } catch (err) {
    console.error('Random handler error:', err);
    return errorResponse('Failed to get random image');
  }
}
