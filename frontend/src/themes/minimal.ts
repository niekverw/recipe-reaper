import { Theme } from '../types/theme'

export const minimal: Theme = {
  id: 'light',
  name: 'Light',
  description: 'Clean minimalistic design with high density layout',
  emoji: '☀️',
  colors: {
    primary: '#0f172a', // slate-900
    secondary: '#64748b', // slate-500
    accent: '#334155', // slate-700
    background: '#ffffff',
    surface: '#f8fafc', // slate-50
    text: {
      primary: '#020617', // slate-950
      secondary: '#64748b', // slate-500
      accent: '#0f172a' // slate-900
    },
    border: {
      primary: '#e2e8f0', // slate-200
      secondary: '#cbd5e1' // slate-300
    },
    button: {
      primary: '#0f172a', // slate-900
      secondary: '#64748b', // slate-500
      danger: '#dc2626' // red-600
    },
    input: {
      background: '#ffffff',
      border: '#cbd5e1', // slate-300
      focus: '#0f172a', // slate-900
      text: '#020617', // slate-950
      placeholder: '#94a3b8' // slate-400
    }
  },
  styles: {
    borderRadius: {
      small: '0.25rem',
      medium: '0.375rem',
      large: '0.5rem',
      full: '9999px'
    },
    shadow: {
      small: '0 1px 2px rgba(0, 0, 0, 0.04)',
      medium: '0 2px 4px rgba(0, 0, 0, 0.06)',
      large: '0 4px 8px rgba(0, 0, 0, 0.08)'
    },
    animation: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}