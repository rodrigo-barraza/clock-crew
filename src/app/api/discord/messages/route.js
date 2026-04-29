// ============================================================
// Clock Crew — Discord Messages API Proxy
// ============================================================
// Proxies requests to tools-service's Discord message search endpoint.
// Hardcodes the guild/channel to prevent abuse.
//
// Private MinIO URLs are rewritten to prevent Chrome's
// Private Network Access (PNA) prompt for all visitors.
// ============================================================

import { rewritePrivateUrls } from "../rewritePrivateUrls.js";

const TOOLS_SERVICE_URL = process.env.TOOLS_SERVICE_URL || "http://localhost:5590";
const GUILD_ID = "249010731910037507"; // Clock Crew
const CHANNEL_ID = "671089694397956116"; // #general-chat

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);

  try {
    const url = `${TOOLS_SERVICE_URL}/discord/messages/search?guildId=${GUILD_ID}&channelId=${CHANNEL_ID}&limit=${limit}&includeBots=true`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch messages" },
        { status: res.status },
      );
    }

    // Sanitize private MinIO URLs before sending to the browser
    const raw = await res.text();
    const sanitized = rewritePrivateUrls(raw);
    return new Response(sanitized, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[discord/messages] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
