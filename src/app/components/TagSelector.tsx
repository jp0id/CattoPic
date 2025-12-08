'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Tag } from 'lucide-react';
import type { TagSelectorProps } from '@/types';

export function TagSelector({
  selectedTags,
  availableTags,
  onTagsChange,
  onNewTagCreated
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setSearchTerm('');
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const handleCreateNewTag = () => {
    const newTag = searchTerm.trim().toLowerCase();
    if (newTag && !selectedTags.includes(newTag) && !availableTags.includes(newTag)) {
      handleAddTag(newTag);
      onNewTagCreated?.();
    }
    setSearchTerm('');
    setShowNewTagInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleAddTag(filteredTags[0]);
      } else {
        handleCreateNewTag();
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        标签
      </label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {selectedTags.length > 0 ? `已选择 ${selectedTags.length} 个标签` : '选择或创建标签'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索或输入新标签..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Tag List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    {tag}
                  </button>
                ))
              ) : searchTerm.trim() ? (
                <button
                  onClick={handleCreateNewTag}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  创建标签 &quot;{searchTerm.trim()}&quot;
                </button>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  暂无标签
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
