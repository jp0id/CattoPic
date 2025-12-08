// Image metadata type
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
  urls: {
    original: string;
    webp: string;
    avif: string;
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
  images: T[];
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

export interface UploadResponse {
  success: boolean;
  results: UploadResult[];
}

// Tag types
export interface Tag {
  name: string;
  count: number;
}

export interface TagsResponse {
  success: boolean;
  tags: Tag[];
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

// Status message
export interface StatusMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

// Component Props
export interface ImageCardProps {
  image: ImageMetadata;
  onClick: () => void;
  onDelete: (id: string) => Promise<void>;
}

export interface ImageModalProps {
  image: ImageMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export interface ImageFiltersProps {
  onFilterChange: (format: string | null, orientation: string | null, tag: string | null) => void;
}

export interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxUploadCount: number;
}

export interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
  onNewTagCreated?: () => void;
}
