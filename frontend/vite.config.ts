import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["studymap.ngố.vn", "studymap.xn--ng-k9s.vn"],
  },
});
