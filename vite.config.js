import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function jsInSrcAsJsx() {
  return {
    name: "js-in-src-as-jsx",
    enforce: "pre",
    async transform(code, id) {
      const [filepath] = id.split("?", 1);

      if (!/src[\\/].*\.jsx?$/.test(filepath)) {
        return null;
      }

      return transformWithEsbuild(code, filepath, {
        loader: "jsx",
      });
    },
  };
}

export default defineConfig(() => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    watch: { usePolling: true, interval: 300 },
    hmr: {
      overlay: true,
    },
  },
  plugins: [jsInSrcAsJsx(), react()],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src[\\/].*\.jsx?$/,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
