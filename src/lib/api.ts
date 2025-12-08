import type {
  ImageMetadata,
  PaginatedResponse,
  UploadResponse,
  TagsResponse,
  Tag,
  Config,
  ImageFilters
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_WORKER_URL || '';

// Get stored API key
function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('imageflow_api_key');
}

// Set API key
export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('imageflow_api_key', key);
  }
}

// Clear API key
export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('imageflow_api_key');
  }
}

// Build headers with auth
function buildHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {};

  if (includeAuth) {
    const apiKey = getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  return headers;
}

// API client
export const api = {
  // Validate API key
  async validateApiKey(key?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/validate-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key || getApiKey()}`
        }
      });
      const data = await response.json();
      return data.success && data.valid;
    } catch {
      return false;
    }
  },

  // Upload images
  async upload(files: File[], tags: string[], expiryMinutes?: number): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    formData.append('tags', tags.join(','));
    if (expiryMinutes) {
      formData.append('expiryMinutes', String(expiryMinutes));
    }

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: buildHeaders(),
      body: formData
    });
    return response.json();
  },

  // Get images list
  async getImages(filters: ImageFilters = {}): Promise<PaginatedResponse<ImageMetadata>> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.orientation) params.set('orientation', filters.orientation);

    const response = await fetch(`${API_BASE}/api/images?${params}`, {
      headers: buildHeaders()
    });
    return response.json();
  },

  // Get single image
  async getImage(id: string): Promise<{ success: boolean; image: ImageMetadata }> {
    const response = await fetch(`${API_BASE}/api/images/${id}`, {
      headers: buildHeaders()
    });
    return response.json();
  },

  // Update image
  async updateImage(id: string, data: { tags?: string[]; expiryMinutes?: number }): Promise<{ success: boolean; image: ImageMetadata }> {
    const response = await fetch(`${API_BASE}/api/images/${id}`, {
      method: 'PUT',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Delete image
  async deleteImage(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/api/images/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return response.json();
  },

  // Get all tags
  async getTags(): Promise<TagsResponse> {
    const response = await fetch(`${API_BASE}/api/tags`, {
      headers: buildHeaders()
    });
    return response.json();
  },

  // Create tag
  async createTag(name: string): Promise<{ success: boolean; tag: Tag }> {
    const response = await fetch(`${API_BASE}/api/tags`, {
      method: 'POST',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  // Rename tag
  async renameTag(oldName: string, newName: string): Promise<{ success: boolean; tag: Tag }> {
    const response = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newName })
    });
    return response.json();
  },

  // Delete tag
  async deleteTag(name: string): Promise<{ success: boolean; message: string; affectedImages: number }> {
    const response = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return response.json();
  },

  // Batch update tags
  async batchUpdateTags(imageIds: string[], addTags: string[], removeTags: string[]): Promise<{ success: boolean; updatedCount: number }> {
    const response = await fetch(`${API_BASE}/api/tags/batch`, {
      method: 'POST',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageIds, addTags, removeTags })
    });
    return response.json();
  },

  // Get config
  async getConfig(): Promise<{ success: boolean; config: Config }> {
    const response = await fetch(`${API_BASE}/api/config`, {
      headers: buildHeaders()
    });
    return response.json();
  },

  // Cleanup expired images
  async cleanup(): Promise<{ success: boolean; deletedCount: number }> {
    const response = await fetch(`${API_BASE}/api/cleanup`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return response.json();
  },

  // Get random image URL
  getRandomUrl(params?: {
    tags?: string[];
    exclude?: string[];
    orientation?: 'landscape' | 'portrait' | 'auto';
    format?: 'original' | 'webp' | 'avif';
  }): string {
    const query = new URLSearchParams();
    if (params?.tags?.length) query.set('tags', params.tags.join(','));
    if (params?.exclude?.length) query.set('exclude', params.exclude.join(','));
    if (params?.orientation) query.set('orientation', params.orientation);
    if (params?.format) query.set('format', params.format);

    const queryString = query.toString();
    return `${API_BASE}/api/random${queryString ? '?' + queryString : ''}`;
  }
};
