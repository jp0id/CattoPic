'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, Trash2, ExternalLink, Download,
  Calendar, Tag, Image, Maximize2
} from 'lucide-react';
import type { ImageModalProps } from '@/types';
import { copyToClipboard, formatDate, formatFileSize, getOrientationLabel, getFormatLabel } from '@/lib/utils';

export function ImageModal({ image, isOpen, onClose, onDelete }: ImageModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!image) return null;

  const handleCopy = async (url: string, type: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(image.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isGif = image.format === 'gif';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row max-h-[90vh]">
              {/* Image Preview */}
              <div className="md:w-2/3 bg-gray-900 flex items-center justify-center p-4">
                <img
                  src={image.urls.original}
                  alt={image.originalName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* Info Panel */}
              <div className="md:w-1/3 p-6 overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 truncate">
                  {image.originalName}
                </h2>

                {/* Info Grid */}
                <div className="space-y-4">
                  {/* Format & Orientation */}
                  <div className="flex gap-2">
                    <span className={`
                      px-2.5 py-1 text-xs font-medium rounded-full
                      ${isGif
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }
                    `}>
                      {getFormatLabel(image.format)}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {getOrientationLabel(image.orientation)}
                    </span>
                  </div>

                  {/* Dimensions */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Maximize2 className="w-4 h-4" />
                    <span>{image.width} x {image.height}</span>
                  </div>

                  {/* Upload Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(image.uploadTime)}</span>
                  </div>

                  {/* File Size */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Image className="w-4 h-4" />
                    <span>{formatFileSize(image.sizes.original)}</span>
                  </div>

                  {/* Tags */}
                  {image.tags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Tag className="w-4 h-4" />
                        <span>标签</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {image.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URLs */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      链接
                    </p>
                    <div className="space-y-2">
                      {/* Original URL */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={image.urls.original}
                          readOnly
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg truncate"
                        />
                        <button
                          onClick={() => handleCopy(image.urls.original, 'original')}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="复制原始链接"
                        >
                          {copied === 'original' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* WebP URL */}
                      {!isGif && image.urls.webp && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">WebP</span>
                          <input
                            type="text"
                            value={image.urls.webp}
                            readOnly
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg truncate"
                          />
                          <button
                            onClick={() => handleCopy(image.urls.webp, 'webp')}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {copied === 'webp' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* AVIF URL */}
                      {!isGif && image.urls.avif && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">AVIF</span>
                          <input
                            type="text"
                            value={image.urls.avif}
                            readOnly
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg truncate"
                          />
                          <button
                            onClick={() => handleCopy(image.urls.avif, 'avif')}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {copied === 'avif' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <a
                      href={image.urls.original}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      打开
                    </a>

                    {onDelete && (
                      showDeleteConfirm ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? '删除中...' : '确认'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
