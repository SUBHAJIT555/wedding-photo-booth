import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy PHP requests to your PHP server during development
      // Make sure you have a PHP server running (e.g., php -S localhost:8000)
      "/upload-image.php": {
        target: "http://localhost/photo-booth/",
        changeOrigin: true,
      },
      "/auth.php": {
        target: "http://localhost/photo-booth/",
        changeOrigin: true,
      },
      "/i.php": {
        target: "http://localhost/photo-booth/",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost/photo-booth/",
        changeOrigin: true,
      },
    },
  },
});
