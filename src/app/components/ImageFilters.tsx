'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Tag } from 'lucide-react';

interface ImageFiltersProps {
  tags: string[];
  selectedTag: string | null;
  selectedOrientation: string | null;
  onFilterChange: (tag: string | null, orientation: string | null) => void;
}

export function ImageFilters({
  tags,
  selectedTag,
  selectedOrientation,
  onFilterChange
}: ImageFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = tags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const hasActiveFilters = selectedTag || selectedOrientation;

  const clearFilters = () => {
    onFilterChange(null, null);
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-40">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-4 rounded-full shadow-lg transition-all duration-300
          ${hasActiveFilters
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        <Filter className="w-6 h-6" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {(selectedTag ? 1 : 0) + (selectedOrientation ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">筛选</h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    清除
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orientation Filter */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                方向
              </p>
              <div className="flex gap-2">
                {[
                  { value: null, label: '全部' },
                  { value: 'landscape', label: '横向' },
                  { value: 'portrait', label: '纵向' }
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => onFilterChange(selectedTag, value)}
                    className={`
                      flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors
                      ${selectedOrientation === value
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            <div className="p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </p>

              {/* Tag Search */}
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="搜索标签..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              />

              {/* Tag List */}
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedTag && (
                  <button
                    onClick={() => onFilterChange(null, selectedOrientation)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {selectedTag}
                    <X className="w-3.5 h-3.5 ml-auto" />
                  </button>
                )}

                {filteredTags
                  .filter(tag => tag !== selectedTag)
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => onFilterChange(tag, selectedOrientation)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      {tag}
                    </button>
                  ))}

                {filteredTags.length === 0 && !selectedTag && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    暂无标签
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
