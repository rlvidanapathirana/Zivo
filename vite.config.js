import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const isGithubActions = process.env.GITHUB_ACTIONS || false;
const basePath = isGithubActions ? '/Zivo/' : './';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'icons/*.png'],
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/i\.ytimg\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'yt-thumbnails',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: 'Zivo — Ad-Free Video Platform',
        short_name: 'Zivo',
        description: 'Ad-free video streaming app protected by SponsorBlock.',
        theme_color: '#0b0717',
        background_color: '#0b0717',
        display: 'standalone',
        orientation: 'any',
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['entertainment', 'video', 'utilities'],
      },
    }),
  ],
})
