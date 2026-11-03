import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);

            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [
        tailwindcss(),
        react(),
        // Installable app + offline play. Production only: the dev server, Vitest and Playwright run no service worker.
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            workbox: {
                // The whole build (code, data, art, fonts, about 5 MB) is cached together, so code and data of one
                // version never mix after an update
                globPatterns: ['**/*.{js,css,html,png,jpg,svg,json,ttf,txt,webmanifest}'],
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
            manifest: {
                // The app's identity on the phone (Chrome's default is the start page path). It was 'knowledge-quest';
                // a new id lets a phone with a broken install of the old one install afresh.
                id: '/jo-game/',
                name: 'ພະຈົນໄພຄວາມຮູ້ - Knowledge Quest',
                short_name: 'Knowledge Quest',
                description: 'ເກມຜະຈົນໄພຮຽນຮູ້: ອ່ານຕຳລາ ສ້າງອຸປະກອນ ແລະ ສຳຫຼວດດ່ານ',
                lang: 'lo',
                start_url: './',
                scope: './',
                display: 'fullscreen',
                display_override: ['fullscreen', 'standalone'],
                orientation: 'landscape',
                background_color: '#0b0720',
                theme_color: '#0b0720',
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            }
        }),
        phasermsg()
    ],
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
