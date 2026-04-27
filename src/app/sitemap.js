// ── sitemap.xml via Next.js App Router ───────────────────────
export default function sitemap() {
  const baseUrl = "https://clock-crew.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}
