import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'icon-512.png', 'icon.svg'],
      manifest: {
        name: 'Recipe Reaper',
        short_name: 'Recipe Reaper',
        description: 'Your personal recipe reaper with cooking tips and variations',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/', 
        start_url: '/',
        id: 'recipe-reaper',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
        ],
        shortcuts: [
          {
            name: 'Add Recipe',
            short_name: 'Add Recipe',
            description: 'Quickly add a new recipe',
            url: '/add-recipe',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ],
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            url: 'url',
            text: 'text'
          }
        }
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        // Runtime caching intentionally disabled; re-introduce entries here when ready.
        runtimeCaching: [],
        // Explicitly skip auth routes to prevent Service Worker interference
        navigateFallbackDenylist: [/^\/api\/auth/]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces for phone access
    port: 5173,      // Default Vite port
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      // Proxy API requests to the backend running on localhost
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads requests to the backend for serving images
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0', // Bind to all network interfaces for phone access
    port: 5173,      // Same port as development server
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      'localhost',
      '127.0.0.1'
    ],
  },
})