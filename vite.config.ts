import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'content-horology-foundations', test: /learning-content[\\/]horology-foundations[\\/]/, priority: 30 },
            { name: 'content-quartz-2035', test: /learning-content[\\/]quartz-miyota2035[\\/]/, priority: 30 },
            { name: 'content-mechanical-foundations', test: /learning-content[\\/]mechanical-foundations[\\/]/, priority: 30 },
            { name: 'content-miyota-8215', test: /learning-content[\\/]miyota8215[\\/]/, priority: 30 },
            { name: 'content-inspection-metrology', test: /learning-content[\\/]inspection-metrology[\\/]/, priority: 30 },
            { name: 'content-advanced-watchmaking', test: /learning-content[\\/]advanced-watchmaking[\\/]/, priority: 30 },
            { name: 'content-watchmaking-capstone', test: /learning-content[\\/]watchmaking-capstone[\\/]/, priority: 30 },
            { name: 'content-watchmaking-encyclopedia', test: /learning-content[\\/]watchmaking-encyclopedia[\\/]/, priority: 30 },
            { name: 'react-runtime', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
  },
})
