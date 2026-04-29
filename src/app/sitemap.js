// ── sitemap.xml via Next.js App Router ───────────────────────
// Generates a comprehensive sitemap including all static pages
// and all dynamic /clocks/[username] member profiles.
// ──────────────────────────────────────────────────────────────

const BASE_URL = "https://clocktopia.com";
const CLOCK_CREW_SERVICE_URL =
  process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export const revalidate = 86400; // Revalidate sitemap once per day

function safeDate(str) {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap() {
  // ── Static pages ────────────────────────────────────────────
  const now = new Date();
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/clocks`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/history`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // ── Dynamic member profile pages ────────────────────────────
  let memberPages = [];
  try {
    const res = await fetch(
      `${CLOCK_CREW_SERVICE_URL}/clockcrew/users?limit=5000`,
      { cache: "no-store" },
    );

    if (res.ok) {
      const data = await res.json();
      const users = data.users || [];

      memberPages = users.map((user) => ({
        url: `${BASE_URL}/clocks/${encodeURIComponent(user.username)}`,
        lastModified: safeDate(user.dateRegistered),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch members:", err.message);
    // Return only static pages if service is unavailable
  }

  return [...staticPages, ...memberPages];
}
