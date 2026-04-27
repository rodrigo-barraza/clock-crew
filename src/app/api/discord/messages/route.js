// ============================================================
// Clock Crew — Discord Messages API Proxy
// ============================================================
// Proxies requests to tools-api's Discord message search endpoint.
// Hardcodes the guild/channel to prevent abuse.
// ============================================================

const TOOLS_API_URL = process.env.TOOLS_API_URL || "http://192.168.86.2:5590";
const GUILD_ID = "249010731910037507"; // Clock Crew
const CHANNEL_ID = "671089694397956116"; // #general-chat

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  try {
    const url = `${TOOLS_API_URL}/discord/messages/search?guildId=${GUILD_ID}&channelId=${CHANNEL_ID}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 60 }, // ISR — cache for 60 seconds
    });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch messages" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[discord/messages] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
