'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { TagSelector } from './TagSelector';
import { useUpload } from '@/hooks/useUpload';

interface UploadSectionProps {
  availableTags: string[];
  maxUploadCount: number;
  onUploadComplete: () => void;
  onNewTagCreated: () => void;
}

export function UploadSection({
  availableTags,
  maxUploadCount,
  onUploadComplete,
  onNewTagCreated
}: UploadSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const { uploading, progress, upload, reset } = useUpload();

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...files].slice(0, maxUploadCount);
      return newFiles;
    });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const results = await upload(selectedFiles, selectedTags);

    if (results.some(r => r.status === 'success')) {
      // Clear files and refresh
      setTimeout(() => {
        setSelectedFiles([]);
        reset();
        onUploadComplete();
      }, 1500);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setSelectedTags([]);
    reset();
  };

  const successCount = progress.filter(p => p.status === 'success').length;
  const errorCount = progress.filter(p => p.status === 'error').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">上传图片</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFiles.length > 0
                ? `已选择 ${selectedFiles.length} 个文件`
                : '拖拽或点击上传'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Dropzone */}
              {selectedFiles.length === 0 && !uploading && (
                <UploadDropzone
                  onFilesSelected={handleFilesSelected}
                  maxUploadCount={maxUploadCount}
                />
              )}

              {/* Selected Files */}
              {selectedFiles.length > 0 && !uploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      已选择的文件
                    </p>
                    <button
                      onClick={handleClear}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      清除全部
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}

                    {/* Add More Button */}
                    {selectedFiles.length < maxUploadCount && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">添加更多</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files ? Array.from(e.target.files) : [];
                            handleFilesSelected(files);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      上传中...
                    </span>
                  </div>

                  <div className="space-y-2">
                    {progress.map((p, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={URL.createObjectURL(p.file)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.file.name}</p>
                          {p.status === 'uploading' && (
                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded mt-1">
                              <div className="h-full bg-indigo-500 rounded animate-pulse" style={{ width: '100%' }} />
                            </div>
                          )}
                        </div>
                        {p.status === 'success' && (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        {p.status === 'error' && (
                          <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Results */}
              {!uploading && progress.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {successCount > 0 && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      {successCount} 个成功
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 text-sm text-red-500">
                      <X className="w-4 h-4" />
                      {errorCount} 个失败
                    </span>
                  )}
                </div>
              )}

              {/* Tag Selector */}
              {selectedFiles.length > 0 && !uploading && progress.length === 0 && (
                <TagSelector
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onTagsChange={setSelectedTags}
                  onNewTagCreated={onNewTagCreated}
                />
              )}

              {/* Upload Button */}
              {selectedFiles.length > 0 && !uploading && progress.length === 0 && (
                <button
                  onClick={handleUpload}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  上传 {selectedFiles.length} 个文件
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
