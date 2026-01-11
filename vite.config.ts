import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX 插件要放在 React 插件之前
    mdx({
      providerImportSource: '@mdx-js/react',
    }),
    react(),
    nodePolyfills({
      // Enable polyfills for Buffer and other Node.js globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfills for specific Node.js modules
      protocolImports: true,
    }),
  ],
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
