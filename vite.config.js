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

      if (!/src[\\/].*\.js$/.test(filepath)) {
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
    hmr: {
      overlay: false,
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
    include: /src[\\/].*\.js$/,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
