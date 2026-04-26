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

/**
 * Replace private-network hostnames with `localhost` so the browser
 * (running on Windows) can reach the service via port-forwarding.
 */
function normaliseForBrowser(urlStr) {
  try {
    const u = new URL(urlStr);
    if (/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(u.hostname)) {
      u.hostname = "localhost";
    }
    return u.toString().replace(/\/$/, ""); // strip trailing slash
  } catch {
    return urlStr;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["clock-crew.com"],
  turbopack: {},

  env: {
    CLOCK_CREW_PORT: secrets.CLOCK_CREW_PORT || "3000",
  },
};

export default nextConfig;
