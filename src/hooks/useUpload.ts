'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UploadResult } from '@/types';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  error?: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);

  const upload = useCallback(async (
    files: File[],
    tags: string[],
    expiryMinutes?: number
  ): Promise<UploadResult[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setProgress(files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    })));
    setResults([]);

    try {
      const response = await api.upload(files, tags, expiryMinutes);

      if (response.success) {
        setResults(response.results);
        setProgress(files.map((file, index) => ({
          file,
          progress: 100,
          status: response.results[index]?.status === 'success' ? 'success' : 'error',
          result: response.results[index],
          error: response.results[index]?.error
        })));
        return response.results;
      } else {
        setProgress(files.map(file => ({
          file,
          progress: 0,
          status: 'error',
          error: 'Upload failed'
        })));
        return [];
      }
    } catch (err) {
      console.error('Upload error:', err);
      setProgress(files.map(file => ({
        file,
        progress: 0,
        status: 'error',
        error: 'Upload failed'
      })));
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress([]);
    setResults([]);
  }, []);

  return {
    uploading,
    progress,
    results,
    upload,
    reset
  };
}
