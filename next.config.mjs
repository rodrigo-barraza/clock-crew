// ============================================================
// Clock Crew — Next.js Configuration
// ============================================================
// Bootstraps secrets from Vault (or .env fallback) at startup
// and injects them into process.env for the app.
// ============================================================

import { createVaultClient } from "./utils/vault-client.js";

// ── Bootstrap secrets at build/dev time ────────────────────────
const vault = createVaultClient({
  localEnvFile: "./.env",
  fallbackEnvFile: "../vault/.env",
});

const secrets = await vault.fetch();

// Inject into process.env so secrets.js can read them
Object.assign(process.env, secrets);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["clocktopia.com"],
  turbopack: {},

  // Discord avatar and attachment images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
      },
    ],
  },

  env: {
    CLOCK_CREW_PORT: secrets.CLOCK_CREW_PORT || "3001",
  },

  // Server-only env — NOT exposed to the browser
  serverRuntimeConfig: {
    TOOLS_API_URL: secrets.TOOLS_API_URL || "http://192.168.86.2:5590",
  },

  // 301 redirect www → bare domain (canonical URL)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.clocktopia.com" }],
        destination: "https://clocktopia.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
