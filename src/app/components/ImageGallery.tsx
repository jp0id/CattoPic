'use client';

import { AnimatePresence } from 'framer-motion';
import { ImageCard } from './ImageCard';
import { Loader2, ImageOff } from 'lucide-react';
import type { ImageMetadata } from '@/types';

interface ImageGalleryProps {
  images: ImageMetadata[];
  loading: boolean;
  onImageClick: (image: ImageMetadata) => void;
  onImageDelete: (id: string) => Promise<void>;
}

export function ImageGallery({
  images,
  loading,
  onImageClick,
  onImageDelete
}: ImageGalleryProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <ImageOff className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          暂无图片
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          上传图片开始使用
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <AnimatePresence mode="popLayout">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onClick={() => onImageClick(image)}
            onDelete={onImageDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
