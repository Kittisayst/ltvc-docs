/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/ltvc-docs/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/PhetsarathOT.ttf'],
      manifest: {
        name: 'ລະບົບພິມໃບຍ້ອງຍໍ',
        short_name: 'ໃບຍ້ອງຍໍ',
        description: 'ອອກແບບແລະພິມໃບຍ້ອງຍໍ overlay ໃສ່ເຈ້ຍພິມລ່ວງໜ້າ',
        lang: 'lo',
        theme_color: '#2f5597',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'ltvc_logo.png', sizes: '488x475', type: 'image/png', purpose: 'any' },
          { src: 'ltvc_logo.png', sizes: '488x475', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,ico}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
