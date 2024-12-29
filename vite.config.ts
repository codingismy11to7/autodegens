import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
