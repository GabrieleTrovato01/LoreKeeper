import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Quando il frontend (Vite) vede una richiesta che inizia per '/api', 
      // la "devia" segretamente al nostro backend Node.js sulla porta 3000
      '/api': 'http://localhost:3000'
    }
  }
});