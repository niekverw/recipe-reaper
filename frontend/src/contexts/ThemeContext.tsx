import { createContext, useContext, useEffect, useState } from 'react'
import { Theme, ThemeContextType } from '../types/theme'
import { minimal } from '../themes/minimal'
import { dark } from '../themes/dark'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const availableThemes = [minimal, dark]

interface ThemeProviderProps {
  children: React.ReactNode
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function getStoredTheme(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || getSystemTheme()
  }
  return 'light'
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentThemeId, setCurrentThemeId] = useState<string>(getStoredTheme())

  const currentTheme = availableThemes.find(theme => theme.id === currentThemeId) || minimal

  const setTheme = (themeId: string) => {
    setCurrentThemeId(themeId)
    localStorage.setItem('theme', themeId)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme')
      if (!storedTheme) {
        setCurrentThemeId(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const theme = currentTheme

    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-accent', theme.colors.text.accent)
    root.style.setProperty('--color-border-primary', theme.colors.border.primary)
    root.style.setProperty('--color-border-secondary', theme.colors.border.secondary)
    root.style.setProperty('--color-button-primary', theme.colors.button.primary)
    root.style.setProperty('--color-button-secondary', theme.colors.button.secondary)
    root.style.setProperty('--color-button-danger', theme.colors.button.danger)
    root.style.setProperty('--color-input-background', theme.colors.input.background)
    root.style.setProperty('--color-input-border', theme.colors.input.border)
    root.style.setProperty('--color-input-focus', theme.colors.input.focus)
    root.style.setProperty('--color-input-text', theme.colors.input.text)
    root.style.setProperty('--color-input-placeholder', theme.colors.input.placeholder)

    root.style.setProperty('--border-radius-small', theme.styles.borderRadius.small)
    root.style.setProperty('--border-radius-medium', theme.styles.borderRadius.medium)
    root.style.setProperty('--border-radius-large', theme.styles.borderRadius.large)
    root.style.setProperty('--border-radius-full', theme.styles.borderRadius.full)

    root.style.setProperty('--shadow-small', theme.styles.shadow.small)
    root.style.setProperty('--shadow-medium', theme.styles.shadow.medium)
    root.style.setProperty('--shadow-large', theme.styles.shadow.large)

    root.style.setProperty('--animation-duration', theme.styles.animation.duration)
    root.style.setProperty('--animation-easing', theme.styles.animation.easing)

    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.text.primary

    if (theme.customCSS) {
      let styleEl = document.getElementById('theme-custom-css')
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'theme-custom-css'
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = theme.customCSS
    }
  }, [currentTheme])

  const value: ThemeContextType = {
    currentTheme,
    availableThemes,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}