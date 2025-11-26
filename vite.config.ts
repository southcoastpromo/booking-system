import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(import.meta.dirname, "client");

  return {
    plugins: [
      react(),
      ...(mode === "analyze"
        ? [
            visualizer({
              filename: "dist/stats.html",
              open: true,
              gzipSize: true,
              brotliSize: true,
              template: "treemap",
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: rootDir,
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      target: "es2020",
      minify: "esbuild",
      rollupOptions: {
        input: path.resolve(rootDir, "index.html"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5000,
        host: "0.0.0.0",
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
