import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/keyboard-layout-studio/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
