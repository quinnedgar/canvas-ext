import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: undefined // Prevent bundling
    },
    outDir: 'build', // Output directory
    emptyOutDir: true, // Clean the output directory before building
  },
  publicDir: 'src', // Treat the `src` directory as static files
});