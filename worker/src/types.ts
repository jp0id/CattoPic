// Cloudflare Worker bindings
export interface Env {
  R2_BUCKET: R2Bucket;
  KV: KVNamespace;
  ENVIRONMENT: string;
}

// Image metadata stored in KV
export interface ImageMetadata {
  id: string;
  originalName: string;
  uploadTime: string;
  expiryTime?: string;
  orientation: 'landscape' | 'portrait';
  tags: string[];
  format: string;
  width: number;
  height: number;
  paths: {
    original: string;
    webp: string;
    avif: string;
  };
  sizes: {
    original: number;
    webp: number;
    avif: number;
  };
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Upload types
export interface UploadResult {
  id: string;
  status: 'success' | 'error';
  urls?: {
    original: string;
    webp: string;
    avif: string;
  };
  orientation?: 'landscape' | 'portrait';
  tags?: string[];
  sizes?: {
    original: number;
    webp: number;
    avif: number;
  };
  expiryTime?: string;
  error?: string;
}

// Tag types
export interface Tag {
  name: string;
  count: number;
}

// Config types
export interface Config {
  maxUploadCount: number;
  maxFileSize: number;
  supportedFormats: string[];
  imageQuality: number;
}

// Filter types
export interface ImageFilters {
  page?: number;
  limit?: number;
  tag?: string;
  orientation?: 'landscape' | 'portrait';
}

export interface RandomFilters {
  tags?: string[];
  exclude?: string[];
  orientation?: 'landscape' | 'portrait' | 'auto';
  format?: 'original' | 'webp' | 'avif';
}
