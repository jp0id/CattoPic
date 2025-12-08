'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ImageMetadata, ImageFilters } from '@/types';

export function useImages() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchImages = useCallback(async (filters: ImageFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getImages(filters);
      if (response.success) {
        setImages(response.images);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } else {
        setError('Failed to fetch images');
      }
    } catch (err) {
      setError('Failed to fetch images');
      console.error('Fetch images error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await api.deleteImage(id);
      if (response.success) {
        setImages(prev => prev.filter(img => img.id !== id));
        setTotal(prev => prev - 1);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete image error:', err);
      return false;
    }
  }, []);

  const updateImage = useCallback(async (id: string, data: { tags?: string[]; expiryMinutes?: number }): Promise<boolean> => {
    try {
      const response = await api.updateImage(id, data);
      if (response.success) {
        setImages(prev => prev.map(img =>
          img.id === id ? response.image : img
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update image error:', err);
      return false;
    }
  }, []);

  const refreshImages = useCallback(async () => {
    await fetchImages({ page });
  }, [fetchImages, page]);

  return {
    images,
    loading,
    error,
    page,
    totalPages,
    total,
    fetchImages,
    deleteImage,
    updateImage,
    refreshImages,
    setPage
  };
}
