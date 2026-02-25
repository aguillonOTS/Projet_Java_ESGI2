import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Le bundle final va directement dans les ressources statiques du backend Spring Boot
    outDir: '../Backend/src/main/resources/static',
    emptyOutDir: true,
  }
})
