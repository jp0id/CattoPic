import { useState, useEffect } from 'react'

// 获取初始主题状态
function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    return document.documentElement.classList.contains('dark')
  } catch {
    return document.documentElement.classList.contains('dark')
  }
}

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme)

  // 同步 DOM 状态
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  return { isDarkMode, toggleTheme }
} 
