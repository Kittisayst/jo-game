import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const devPort = Number(process.env.PORT ?? 8088);

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        tailwindcss(),
        react(),
    ],
    server: {
        host: '127.0.0.1',
        port: devPort,
        strictPort: true
    }
})
