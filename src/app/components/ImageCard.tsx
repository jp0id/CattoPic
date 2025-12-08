'use client';

import { useState } from 'react';
import { Copy, Trash2, ExternalLink, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ImageCardProps } from '@/types';
import { copyToClipboard, getOrientationLabel, getFormatLabel } from '@/lib/utils';

export function ImageCard({ image, onClick, onDelete }: ImageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (url: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张图片吗？')) {
      setIsDeleting(true);
      await onDelete(image.id);
    }
  };

  const isGif = image.format === 'gif';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm
        hover:shadow-lg transition-all duration-300 cursor-pointer
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={image.urls.original}
          alt={image.originalName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Actions on hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => handleCopy(image.urls.original, 'original', e)}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            title="复制原始链接"
          >
            {copied === 'original' ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-700" />
            )}
          </button>

          {!isGif && image.urls.webp && (
            <button
              onClick={(e) => handleCopy(image.urls.webp, 'webp', e)}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              title="复制 WebP 链接"
            >
              {copied === 'webp' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <span className="text-xs font-medium text-gray-700">WebP</span>
              )}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(image.urls.original, '_blank');
            }}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            title="新窗口打开"
          >
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {image.originalName}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {/* Format badge */}
          <span className={`
            px-2 py-0.5 text-xs font-medium rounded-full
            ${isGif
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }
          `}>
            {getFormatLabel(image.format)}
          </span>

          {/* Orientation badge */}
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {getOrientationLabel(image.orientation)}
          </span>
        </div>

        {/* Tags */}
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {image.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {image.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-400">
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
