import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Calendar build id (guardrail G8: no product version is ever shown). YYYY.MM.<day><hour> keeps ids unique per build.
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const buildId = `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(now.getUTCDate())}${pad(now.getUTCHours())}`;
let commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '';
if (!commit) {
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    commit = 'local';
  }
}

export default defineConfig({
  base: '/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
    __COMMIT__: JSON.stringify(commit),
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { host: '0.0.0.0', port: 5173, strictPort: false, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react/jsx-runtime'],
          data: ['yjs', 'y-indexeddb', 'dexie', 'dexie-react-hooks'],
          markdown: ['markdown-it', 'dompurify'],
        },
        // Icons loaded on demand (lucide-react/dynamic) are about 1,500 tiny chunks. They live in their own
        // directory so the service worker can leave them out of the precache and cache them on first use instead.
        chunkFileNames: (chunk) => (chunk.facadeModuleId?.includes('/lucide-react/dist/esm/icons/') ? 'assets/icons/[name]-[hash].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/icon.svg', 'logo.svg', 'logo-mono.svg', 'fonts/*.woff2', 'og-image.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Boxy',
        short_name: 'Boxy',
        description: 'Your snippets, offline first.',
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        theme_color: '#0a1628',
        background_color: '#0a1628',
        categories: ['productivity', 'utilities'],
        icons: [
          ...[72, 96, 128, 144, 152, 192, 384, 512].map((s) => ({
            src: `/icons/icon-${s}.png`,
            sizes: `${s}x${s}`,
            type: 'image/png',
            purpose: 'any',
          })),
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'New card', short_name: 'New card', url: '/?action=new-card', icons: [{ src: '/icons/shortcut-plus.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Search', short_name: 'Search', url: '/?action=search', icons: [{ src: '/icons/shortcut-search.png', sizes: '96x96', type: 'image/png' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        globIgnores: ['**/assets/icons/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/icons\/.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'boxy-icons', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [200] } },
          },
        ],
        navigateFallback: '/index.html',
        // /boxy/* is the address of the previous app; Vercel rewrites it to the static notice page, so the SW must not answer it with the app shell.
        navigateFallbackDenylist: [/^\/api\//, /^\/boxy(\/|$)/, /^\/legacy-redirect\.html$/],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
});
