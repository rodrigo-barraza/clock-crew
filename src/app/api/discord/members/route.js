// ============================================================
// Clock Crew — Discord Members API Proxy
// ============================================================
// Proxies requests to Lupos for live Discord member/presence data.
// Guild is hardcoded for security.
// ============================================================

const LUPOS_URL = process.env.LUPOS_URL || "http://192.168.86.2:1337";
const GUILD_ID = "249010731910037507"; // Clock Crew

export async function GET() {
  try {
    const url = `${LUPOS_URL}/guild/members?guildId=${GUILD_ID}`;
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch members" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[discord/members] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
