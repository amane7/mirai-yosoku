import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 3000, allowedHosts: true },
  build: {
    // esbuild minify is far faster than terser on this constrained sandbox.
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split the heavy vendor libs so each transform/chunk stays small.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          echarts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          cytoscape: ['cytoscape'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
