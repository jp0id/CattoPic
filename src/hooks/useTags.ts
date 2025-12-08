'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Tag } from '@/types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getTags();
      if (response.success) {
        setTags(response.tags);
      } else {
        setError('Failed to fetch tags');
      }
    } catch (err) {
      setError('Failed to fetch tags');
      console.error('Fetch tags error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (name: string): Promise<boolean> => {
    try {
      const response = await api.createTag(name);
      if (response.success) {
        setTags(prev => [...prev, response.tag]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Create tag error:', err);
      return false;
    }
  }, []);

  const renameTag = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
    try {
      const response = await api.renameTag(oldName, newName);
      if (response.success) {
        setTags(prev => prev.map(tag =>
          tag.name === oldName ? response.tag : tag
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Rename tag error:', err);
      return false;
    }
  }, []);

  const deleteTag = useCallback(async (name: string): Promise<boolean> => {
    try {
      const response = await api.deleteTag(name);
      if (response.success) {
        setTags(prev => prev.filter(tag => tag.name !== name));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete tag error:', err);
      return false;
    }
  }, []);

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    renameTag,
    deleteTag
  };
}
