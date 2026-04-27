// ============================================================
// Clock Crew — Discord Members API Proxy
// ============================================================
// Proxies requests to Lupos for live Discord member/presence data.
// Guild is hardcoded for security.
// Retries on 503 (Discord client not ready) with exponential backoff.
// ============================================================

const LUPOS_URL = process.env.LUPOS_URL || "http://192.168.86.2:1337";
const GUILD_ID = "249010731910037507"; // Clock Crew
const MAX_RETRIES = 3;

export async function GET() {
  let lastStatus = 503;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${LUPOS_URL}/guild/members?guildId=${GUILD_ID}`;
      const res = await fetch(url, { next: { revalidate: 30 } });

      // Retry on 503 — Lupos Discord client isn't ready yet
      if (res.status === 503 && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        lastStatus = 503;
        continue;
      }

      if (!res.ok) {
        return Response.json(
          { error: "Failed to fetch members" },
          { status: res.status },
        );
      }

      const data = await res.json();
      return Response.json(data);
    } catch (error) {
      // Network error — retry if attempts remain
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error("[discord/members] Proxy error:", error.message);
      return Response.json(
        { error: "Service unavailable" },
        { status: 503 },
      );
    }
  }

  return Response.json(
    { error: "Service unavailable — Discord client not ready" },
    { status: lastStatus },
  );
}

