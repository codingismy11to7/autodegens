import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  define: {
    process: JSON.stringify({ env: { NODE_ENV: "production" } }),
  },
  build: {
    lib: {
      entry: [path.resolve(__dirname, "src", "index.ts")],
      formats: ["es"],
      fileName: (format, entryName) => `autodegens-${entryName}.${format}.js`,
    },
  },
});
