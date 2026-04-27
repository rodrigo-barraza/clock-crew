// ── robots.txt via Next.js App Router ────────────────────────
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://clock-crew.com/sitemap.xml",
  };
}
