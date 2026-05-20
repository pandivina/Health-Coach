import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',   // ← necesario para SW personalizado con push
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon.png', 'icons/*.png'],
      manifest: {
        name: 'Health Coach — Tu IA de salud',
        short_name: 'Health Coach',
        description: 'Coaching de salud con IA personalizado con tus datos reales.',
        theme_color: '#2EC4B6',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Registrar comida', url: '/nutrition', icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
          { name: 'Coach IA',         url: '/coach',     icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
          { name: 'Tu Día',           url: '/report',    icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
})
