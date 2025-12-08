'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ImageGallery } from './components/ImageGallery';
import { ImageFilters } from './components/ImageFilters';
import { ImageModal } from './components/ImageModal';
import { useImages } from '@/hooks/useImages';
import { useTags } from '@/hooks/useTags';
import type { ImageMetadata } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);

  const {
    images,
    loading,
    page,
    totalPages,
    fetchImages,
    deleteImage,
    setPage
  } = useImages();

  const { tags, fetchTags } = useTags();

  // Fetch data when authenticated or filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchImages({
        page,
        limit: 20,
        tag: selectedTag || undefined,
        orientation: selectedOrientation as 'landscape' | 'portrait' | undefined
      });
      fetchTags();
    }
  }, [isAuthenticated, page, selectedTag, selectedOrientation, fetchImages, fetchTags]);

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      // Reset state when logged out
      setSelectedTag(null);
      setSelectedOrientation(null);
    }
  };

  const handleFilterChange = (tag: string | null, orientation: string | null) => {
    setSelectedTag(tag);
    setSelectedOrientation(orientation);
    setPage(1); // Reset to first page when filters change
  };

  const handleUploadComplete = useCallback(() => {
    // Refresh images and tags
    fetchImages({
      page: 1,
      limit: 20,
      tag: selectedTag || undefined,
      orientation: selectedOrientation as 'landscape' | 'portrait' | undefined
    });
    fetchTags();
    setPage(1);
  }, [fetchImages, fetchTags, selectedTag, selectedOrientation, setPage]);

  const handleDeleteImage = async (id: string) => {
    const success = await deleteImage(id);
    if (success && selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const tagNames = tags.map(t => t.name);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onAuthChange={handleAuthChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <UploadSection
              availableTags={tagNames}
              maxUploadCount={20}
              onUploadComplete={handleUploadComplete}
              onNewTagCreated={fetchTags}
            />

            {/* Gallery Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  图片库
                </h2>

                {/* Active Filters */}
                {(selectedTag || selectedOrientation) && (
                  <div className="flex items-center gap-2 text-sm">
                    {selectedTag && (
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                        {selectedTag}
                      </span>
                    )}
                    {selectedOrientation && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        {selectedOrientation === 'landscape' ? '横向' : '纵向'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ImageGallery
                images={images}
                loading={loading}
                onImageClick={setSelectedImage}
                onImageDelete={handleDeleteImage}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </button>

                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <ImageFilters
              tags={tagNames}
              selectedTag={selectedTag}
              selectedOrientation={selectedOrientation}
              onFilterChange={handleFilterChange}
            />

            {/* Image Modal */}
            <ImageModal
              image={selectedImage}
              isOpen={!!selectedImage}
              onClose={() => setSelectedImage(null)}
              onDelete={handleDeleteImage}
            />
          </div>
        ) : (
          /* Not Authenticated View */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              欢迎使用 ImageFlow
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
              一个现代化的图片管理和随机图片 API 服务。请先设置 API Key 以开始使用。
            </p>

            <div className="flex flex-col items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <p>功能特性：</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  支持多文件批量上传
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  自动转换 WebP/AVIF 格式
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  标签管理和筛选
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  随机图片 API
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
