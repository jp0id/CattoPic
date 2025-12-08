'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import type { UploadDropzoneProps } from '@/types';

export function UploadDropzone({ onFilesSelected, maxUploadCount }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxUploadCount));
    }
  }, [onFilesSelected, maxUploadCount]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxUploadCount));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected, maxUploadCount]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-200 ease-in-out
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-colors
          ${isDragging
            ? 'bg-indigo-100 dark:bg-indigo-900/30'
            : 'bg-gray-100 dark:bg-gray-800'
          }
        `}>
          {isDragging ? (
            <ImagePlus className="w-8 h-8 text-indigo-500" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {isDragging ? '释放以上传图片' : '拖拽图片到这里上传'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            或点击选择文件 (最多 {maxUploadCount} 张)
          </p>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          支持 JPEG, PNG, GIF, WebP, AVIF 格式
        </p>
      </div>
    </div>
  );
}
