import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { analyzer } from 'vite-bundle-analyzer';


export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    analyzer(),
  ],
});
