import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch for tests
;(globalThis as any).fetch = vi.fn()

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockImplementation(() => true),
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
;(globalThis as any).console = {
  ...originalConsole,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}