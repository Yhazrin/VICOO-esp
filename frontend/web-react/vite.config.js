import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        // Pre-compress static assets with gzip (nginx serves .gz files directly)
        viteCompression({ algorithm: 'gzip', ext: '.gz' }),
        // Brotli for modern browsers
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        target: 'es2020',
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Three.js (~600KB) — only loaded on 3D pages
                    'vendor-three': ['three'],
                    // Framer Motion (~150KB) — split from main bundle
                    'vendor-motion': ['framer-motion'],
                    // React core
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // i18n
                    'vendor-i18n': ['i18next', 'react-i18next'],
                },
            },
        },
    },
    server: {
        port: 9111,
        open: true,
        // Dev: browser calls same-origin /api/v1 → forwarded to Docker or local API (avoids CORS)
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                ws: true,
            },
            '/static': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
        strictPort: true,
    },
});
