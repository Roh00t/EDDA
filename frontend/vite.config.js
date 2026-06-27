import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only: forward the API call to the FastAPI backend on :8000.
    // In production the built app is served same-origin by FastAPI, so /analyze
    // resolves without a proxy.
    proxy: {
      "/analyze": "http://localhost:8000",
    },
  },
});
