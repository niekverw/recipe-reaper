export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    accent: string
  }
  border: {
    primary: string
    secondary: string
  }
  button: {
    primary: string
    secondary: string
    danger: string
  }
  input: {
    background: string
    border: string
    focus: string
    text: string
    placeholder: string
  }
}

export interface ThemeStyles {
  borderRadius: {
    small: string
    medium: string
    large: string
    full: string
  }
  shadow: {
    small: string
    medium: string
    large: string
  }
  animation: {
    duration: string
    easing: string
  }
}

export interface Theme {
  id: string
  name: string
  description: string
  emoji: string
  colors: ThemeColors
  styles: ThemeStyles
  customCSS?: string
}

export interface ThemeContextType {
  currentTheme: Theme
  availableThemes: Theme[]
  setTheme: (themeId: string) => void
}