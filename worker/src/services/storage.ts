// R2 Storage Service
export class StorageService {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<void> {
    await this.bucket.put(key, data, {
      httpMetadata: { contentType }
    });
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.bucket.delete(keys);
  }

  async list(prefix: string, limit?: number): Promise<R2Objects> {
    return this.bucket.list({ prefix, limit });
  }

  async exists(key: string): Promise<boolean> {
    const head = await this.bucket.head(key);
    return head !== null;
  }

  // Generate storage paths for an image
  static generatePaths(id: string, orientation: 'landscape' | 'portrait', format: string): {
    original: string;
    webp: string;
    avif: string;
  } {
    const ext = format === 'gif' ? 'gif' : format;
    return {
      original: `original/${orientation}/${id}.${ext}`,
      webp: `${orientation}/webp/${id}.webp`,
      avif: `${orientation}/avif/${id}.avif`
    };
  }
}
