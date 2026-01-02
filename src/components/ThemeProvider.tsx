'use client'

import { useEffect, useState } from 'react'

const COLOR_THEME_KEY = 'color-theme'

type Theme = 'light' | 'dark'
type ThemeConfig = {
  value: Theme
  system: boolean
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setMounted(true)
    
    // Initialize theme from localStorage or system preference
    let themeConfig: ThemeConfig
    
    try {
      const stored = localStorage.getItem(COLOR_THEME_KEY)
      if (!stored) {
        themeConfig = { value: 'light', system: true }
      } else if (stored === 'dark' || stored === 'light') {
        // Legacy format - migrate to new format
        themeConfig = { value: stored as Theme, system: false }
        localStorage.setItem(COLOR_THEME_KEY, JSON.stringify(themeConfig))
      } else {
        themeConfig = JSON.parse(stored)
      }
    } catch {
      themeConfig = { value: 'light', system: true }
    }

    let themeValue: Theme = themeConfig.value
    
    if (themeConfig.system) {
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeValue = 'dark'
      } else {
        themeValue = 'light'
      }
    }

    // Apply theme to document
    if (themeValue === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    
    setTheme(themeValue)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeConfig.system) {
        const newTheme = e.matches ? 'dark' : 'light'
        if (newTheme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.add('dark')
        }
        setTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [system, setSystem] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOR_THEME_KEY)
      if (stored) {
        const config = JSON.parse(stored) as ThemeConfig
        setThemeState(config.value)
        setSystem(config.system)
      }
    } catch {
      // Ignore errors
    }
  }, [])

  const setTheme = (value: Theme | 'system') => {
    if (value === 'system') {
      const config: ThemeConfig = {
        value: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        system: true,
      }
      localStorage.setItem(COLOR_THEME_KEY, JSON.stringify(config))
      setSystem(true)
      const themeValue = config.value
      setThemeState(themeValue)
      if (themeValue === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        document.documentElement.classList.add('dark')
      }
    } else {
      const config: ThemeConfig = { value, system: false }
      localStorage.setItem(COLOR_THEME_KEY, JSON.stringify(config))
      setSystem(false)
      setThemeState(value)
      if (value === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        document.documentElement.classList.add('dark')
      }
    }
  }

  return { theme, system, setTheme } as const
}


