import { Theme } from '../types/theme'

export const dark: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Clean minimalistic dark theme with high density layout',
  emoji: '🌙',
  colors: {
    primary: '#f1f5f9', // slate-100
    secondary: '#94a3b8', // slate-400
    accent: '#cbd5e1', // slate-300
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#94a3b8', // slate-400
      accent: '#f1f5f9' // slate-100
    },
    border: {
      primary: '#334155', // slate-700
      secondary: '#475569' // slate-600
    },
    button: {
      primary: '#f8fafc', // slate-50
      secondary: '#94a3b8', // slate-400
      danger: '#ef4444' // red-500
    },
    input: {
      background: '#1e293b', // slate-800
      border: '#475569', // slate-600
      focus: '#f1f5f9', // slate-100
      text: '#f8fafc', // slate-50
      placeholder: '#64748b' // slate-500
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
      small: '0 1px 2px rgba(0, 0, 0, 0.2)',
      medium: '0 2px 4px rgba(0, 0, 0, 0.3)',
      large: '0 4px 8px rgba(0, 0, 0, 0.4)'
    },
    animation: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}