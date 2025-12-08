import type { ImageMetadata, ImageFilters, Tag } from '../types';

// KV Metadata Service
export class MetadataService {
  constructor(private kv: KVNamespace) {}

  // === Image CRUD ===

  async saveImage(metadata: ImageMetadata): Promise<void> {
    // 1. Save image metadata
    await this.kv.put(`image:${metadata.id}`, JSON.stringify(metadata));

    // 2. Update image ID list
    const ids = await this.getImageIds();
    ids.unshift(metadata.id);
    await this.kv.put('image_ids', JSON.stringify(ids));

    // 3. Update orientation index
    const orientationIds = await this.getImageIds(metadata.orientation);
    orientationIds.unshift(metadata.id);
    await this.kv.put(`image_ids:${metadata.orientation}`, JSON.stringify(orientationIds));

    // 4. Update tag indexes
    for (const tag of metadata.tags) {
      await this.addImageToTag(tag, metadata.id);
    }
  }

  async getImage(id: string): Promise<ImageMetadata | null> {
    const data = await this.kv.get(`image:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async updateImage(id: string, updates: Partial<ImageMetadata>): Promise<ImageMetadata | null> {
    const image = await this.getImage(id);
    if (!image) return null;

    // Handle tag changes
    if (updates.tags) {
      const oldTags = new Set(image.tags);
      const newTags = new Set(updates.tags);

      // Remove from old tags
      for (const tag of oldTags) {
        if (!newTags.has(tag)) {
          await this.removeImageFromTag(tag, id);
        }
      }
      // Add to new tags
      for (const tag of newTags) {
        if (!oldTags.has(tag)) {
          await this.addImageToTag(tag, id);
        }
      }
    }

    const updated = { ...image, ...updates };
    await this.kv.put(`image:${id}`, JSON.stringify(updated));
    return updated;
  }

  async deleteImage(id: string): Promise<boolean> {
    const image = await this.getImage(id);
    if (!image) return false;

    // 1. Delete metadata
    await this.kv.delete(`image:${id}`);

    // 2. Remove from ID list
    const ids = await this.getImageIds();
    await this.kv.put('image_ids', JSON.stringify(ids.filter(i => i !== id)));

    // 3. Remove from orientation index
    const orientationIds = await this.getImageIds(image.orientation);
    await this.kv.put(
      `image_ids:${image.orientation}`,
      JSON.stringify(orientationIds.filter(i => i !== id))
    );

    // 4. Remove from tag indexes
    for (const tag of image.tags) {
      await this.removeImageFromTag(tag, id);
    }

    return true;
  }

  // === Image Queries ===

  async getImageIds(orientation?: string): Promise<string[]> {
    const key = orientation ? `image_ids:${orientation}` : 'image_ids';
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : [];
  }

  async getImages(filters: ImageFilters): Promise<{ images: ImageMetadata[]; total: number }> {
    const { page = 1, limit = 12, tag, orientation } = filters;

    let ids: string[];
    if (tag) {
      ids = await this.getTagImageIds(tag);
      if (orientation) {
        const orientationIds = new Set(await this.getImageIds(orientation));
        ids = ids.filter(id => orientationIds.has(id));
      }
    } else if (orientation) {
      ids = await this.getImageIds(orientation);
    } else {
      ids = await this.getImageIds();
    }

    const total = ids.length;
    const start = (page - 1) * limit;
    const pageIds = ids.slice(start, start + limit);

    const images = await Promise.all(pageIds.map(id => this.getImage(id)));
    return { images: images.filter(Boolean) as ImageMetadata[], total };
  }

  async getRandomImage(filters?: {
    tags?: string[];
    exclude?: string[];
    orientation?: string;
  }): Promise<ImageMetadata | null> {
    let ids: string[];

    // 1. Filter by orientation
    if (filters?.orientation) {
      ids = await this.getImageIds(filters.orientation);
    } else {
      ids = await this.getImageIds();
    }

    // 2. Filter by tags (AND logic)
    if (filters?.tags?.length) {
      for (const tag of filters.tags) {
        const tagIds = new Set(await this.getTagImageIds(tag));
        ids = ids.filter(id => tagIds.has(id));
      }
    }

    // 3. Exclude tags
    if (filters?.exclude?.length) {
      for (const tag of filters.exclude) {
        const excludeIds = new Set(await this.getTagImageIds(tag));
        ids = ids.filter(id => !excludeIds.has(id));
      }
    }

    if (ids.length === 0) return null;

    // 4. Random selection
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    return this.getImage(randomId);
  }

  // === Tag Management ===

  async getAllTags(): Promise<Tag[]> {
    const tagsData = await this.kv.get('tags');
    const tags: string[] = tagsData ? JSON.parse(tagsData) : [];

    return Promise.all(
      tags.map(async name => ({
        name,
        count: (await this.getTagImageIds(name)).length
      }))
    );
  }

  async createTag(name: string): Promise<void> {
    const tags = await this.getAllTagNames();
    if (!tags.includes(name)) {
      tags.push(name);
      await this.kv.put('tags', JSON.stringify(tags));
      await this.kv.put(`tag:${name}`, JSON.stringify([]));
    }
  }

  async renameTag(oldName: string, newName: string): Promise<number> {
    const imageIds = await this.getTagImageIds(oldName);

    // Update all images' tags
    for (const id of imageIds) {
      const image = await this.getImage(id);
      if (image) {
        image.tags = image.tags.map(t => t === oldName ? newName : t);
        await this.kv.put(`image:${id}`, JSON.stringify(image));
      }
    }

    // Update tag index
    await this.kv.put(`tag:${newName}`, JSON.stringify(imageIds));
    await this.kv.delete(`tag:${oldName}`);

    // Update tag list
    const tags = await this.getAllTagNames();
    const newTags = tags.map(t => t === oldName ? newName : t);
    await this.kv.put('tags', JSON.stringify(newTags));

    return imageIds.length;
  }

  async deleteTag(name: string): Promise<number> {
    const imageIds = await this.getTagImageIds(name);

    // Remove tag from all images
    for (const id of imageIds) {
      const image = await this.getImage(id);
      if (image) {
        image.tags = image.tags.filter(t => t !== name);
        await this.kv.put(`image:${id}`, JSON.stringify(image));
      }
    }

    // Delete tag index
    await this.kv.delete(`tag:${name}`);

    // Remove from tag list
    const tags = await this.getAllTagNames();
    await this.kv.put('tags', JSON.stringify(tags.filter(t => t !== name)));

    return imageIds.length;
  }

  async batchUpdateTags(imageIds: string[], addTags: string[], removeTags: string[]): Promise<number> {
    let updatedCount = 0;

    for (const id of imageIds) {
      const image = await this.getImage(id);
      if (!image) continue;

      const currentTags = new Set(image.tags);

      // Remove tags
      for (const tag of removeTags) {
        if (currentTags.has(tag)) {
          currentTags.delete(tag);
          await this.removeImageFromTag(tag, id);
        }
      }

      // Add tags
      for (const tag of addTags) {
        if (!currentTags.has(tag)) {
          currentTags.add(tag);
          await this.addImageToTag(tag, id);
        }
      }

      image.tags = Array.from(currentTags);
      await this.kv.put(`image:${id}`, JSON.stringify(image));
      updatedCount++;
    }

    return updatedCount;
  }

  // === Private Helper Methods ===

  private async getAllTagNames(): Promise<string[]> {
    const data = await this.kv.get('tags');
    return data ? JSON.parse(data) : [];
  }

  private async getTagImageIds(tag: string): Promise<string[]> {
    const data = await this.kv.get(`tag:${tag}`);
    return data ? JSON.parse(data) : [];
  }

  private async addImageToTag(tag: string, imageId: string): Promise<void> {
    // Ensure tag exists
    await this.createTag(tag);

    const ids = await this.getTagImageIds(tag);
    if (!ids.includes(imageId)) {
      ids.unshift(imageId);
      await this.kv.put(`tag:${tag}`, JSON.stringify(ids));
    }
  }

  private async removeImageFromTag(tag: string, imageId: string): Promise<void> {
    const ids = await this.getTagImageIds(tag);
    await this.kv.put(`tag:${tag}`, JSON.stringify(ids.filter(id => id !== imageId)));
  }

  // === Cleanup ===

  async getExpiredImages(): Promise<ImageMetadata[]> {
    const ids = await this.getImageIds();
    const now = new Date().toISOString();
    const expired: ImageMetadata[] = [];

    for (const id of ids) {
      const image = await this.getImage(id);
      if (image?.expiryTime && image.expiryTime < now) {
        expired.push(image);
      }
    }

    return expired;
  }
}
