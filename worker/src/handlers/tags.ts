import type { Context } from 'hono';
import type { Env } from '../types';
import { MetadataService } from '../services/metadata';
import { successResponse, errorResponse } from '../utils/response';
import { sanitizeTagName } from '../utils/validation';

// GET /api/tags - Get all tags
export async function tagsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const metadata = new MetadataService(c.env.KV);
    const tags = await metadata.getAllTags();

    return successResponse({ tags });

  } catch (err) {
    console.error('Tags handler error:', err);
    return errorResponse('Failed to fetch tags');
  }
}

// POST /api/tags - Create new tag
export async function createTagHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json();
    const name = sanitizeTagName(body.name || '');

    if (!name) {
      return errorResponse('Tag name is required');
    }

    const metadata = new MetadataService(c.env.KV);
    await metadata.createTag(name);

    return successResponse({
      tag: { name, count: 0 }
    });

  } catch (err) {
    console.error('Create tag handler error:', err);
    return errorResponse('Failed to create tag');
  }
}

// PUT /api/tags/:name - Rename tag
export async function renameTagHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const oldName = decodeURIComponent(c.req.param('name'));
    const body = await c.req.json();
    const newName = sanitizeTagName(body.newName || '');

    if (!newName) {
      return errorResponse('New tag name is required');
    }

    if (oldName === newName) {
      return errorResponse('New name must be different from old name');
    }

    const metadata = new MetadataService(c.env.KV);
    const affectedCount = await metadata.renameTag(oldName, newName);

    // Get updated count
    const tags = await metadata.getAllTags();
    const tag = tags.find(t => t.name === newName);

    return successResponse({
      tag: tag || { name: newName, count: affectedCount }
    });

  } catch (err) {
    console.error('Rename tag handler error:', err);
    return errorResponse('Failed to rename tag');
  }
}

// DELETE /api/tags/:name - Delete tag
export async function deleteTagHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const name = decodeURIComponent(c.req.param('name'));

    const metadata = new MetadataService(c.env.KV);
    const affectedImages = await metadata.deleteTag(name);

    return successResponse({
      message: 'Tag deleted',
      affectedImages
    });

  } catch (err) {
    console.error('Delete tag handler error:', err);
    return errorResponse('Failed to delete tag');
  }
}

// POST /api/tags/batch - Batch add/remove tags from images
export async function batchTagsHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json();
    const { imageIds, addTags, removeTags } = body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return errorResponse('imageIds array is required');
    }

    const sanitizedAddTags = (addTags || []).map(sanitizeTagName).filter(Boolean);
    const sanitizedRemoveTags = (removeTags || []).map(sanitizeTagName).filter(Boolean);

    if (sanitizedAddTags.length === 0 && sanitizedRemoveTags.length === 0) {
      return errorResponse('Either addTags or removeTags must be provided');
    }

    const metadata = new MetadataService(c.env.KV);
    const updatedCount = await metadata.batchUpdateTags(imageIds, sanitizedAddTags, sanitizedRemoveTags);

    return successResponse({ updatedCount });

  } catch (err) {
    console.error('Batch tags handler error:', err);
    return errorResponse('Failed to update tags');
  }
}
