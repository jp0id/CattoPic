import { type ClassValue, clsx } from 'clsx';

// Combine class names
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get orientation label
export function getOrientationLabel(orientation: 'landscape' | 'portrait'): string {
  return orientation === 'landscape' ? '横向' : '纵向';
}

// Get format label
export function getFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    jpeg: 'JPEG',
    jpg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    webp: 'WebP',
    avif: 'AVIF'
  };
  return labels[format.toLowerCase()] || format.toUpperCase();
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Truncate string
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Generate a simple ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
