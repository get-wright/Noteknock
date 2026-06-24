import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function appRouteFallbackPlugin() {
  return {
    name: "studymap-app-route-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/app" || req.url?.startsWith("/app?") || req.url?.startsWith("/app/")) {
          req.url = "/";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [appRouteFallbackPlugin(), react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["studymap.ngố.vn", "studymap.xn--ng-k9s.vn"],
  },
});
