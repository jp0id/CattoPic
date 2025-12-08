'use client';

import { useState, useEffect } from 'react';
import { Key, Check, X, Image } from 'lucide-react';
import { api, setApiKey, clearApiKey } from '@/lib/api';

interface HeaderProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function Header({ onAuthChange }: HeaderProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    // Check if we have a stored API key
    const storedKey = localStorage.getItem('imageflow_api_key');
    if (storedKey) {
      validateKey(storedKey);
    }
  }, []);

  const validateKey = async (key: string) => {
    setIsValidating(true);
    try {
      const isValid = await api.validateApiKey(key);
      if (isValid) {
        setApiKey(key);
        setIsAuthenticated(true);
        setShowInput(false);
        onAuthChange?.(true);
      } else {
        clearApiKey();
        setIsAuthenticated(false);
        onAuthChange?.(false);
      }
    } catch {
      setIsAuthenticated(false);
      onAuthChange?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      await validateKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };

  const handleLogout = () => {
    clearApiKey();
    setIsAuthenticated(false);
    onAuthChange?.(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ImageFlow
            </h1>
          </div>

          {/* API Key Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                  <Check className="w-4 h-4" />
                  已认证
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="退出登录"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : showInput ? (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="输入 API Key"
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isValidating || !apiKeyInput.trim()}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isValidating ? '验证中...' : '确认'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                <Key className="w-4 h-4" />
                <span>设置 API Key</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
