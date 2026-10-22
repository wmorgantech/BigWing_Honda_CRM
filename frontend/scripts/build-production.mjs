import { build } from "vite";

const requiredApiUrl = "/api/v1";
if (process.env.VITE_API_URL && process.env.VITE_API_URL !== requiredApiUrl) {
  throw new Error(`Production builds require VITE_API_URL=${requiredApiUrl}`);
}

process.env.VITE_API_URL = requiredApiUrl;
await build({ mode: "production" });
