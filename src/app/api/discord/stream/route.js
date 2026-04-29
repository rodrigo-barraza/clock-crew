// ============================================================
// Clock Crew — Discord Messages SSE Stream Proxy
// ============================================================
// Proxies the tools-service SSE stream to the browser. The browser
// connects via EventSource to this Next.js route, which in turn
// opens a persistent connection to tools-service and pipes the
// events through. Guild is hardcoded for security; channel is
// selectable from a whitelist.
//
// Private MinIO URLs are rewritten on the fly to prevent Chrome's
// Private Network Access (PNA) prompt for all visitors.
// ============================================================

import { rewriteStream } from "../rewritePrivateUrls.js";

const TOOLS_SERVICE_URL = process.env.TOOLS_SERVICE_URL || "http://localhost:5590";
const GUILD_ID = "249010731910037507"; // Clock Crew

// Whitelist of allowed channel IDs (prevents arbitrary channel access)
const ALLOWED_CHANNELS = new Set([
  "671089694397956116", // #general-chat
  "676318241689436170", // #memes
]);

const DEFAULT_CHANNEL = "671089694397956116";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);
  const channelId = searchParams.get("channelId") || DEFAULT_CHANNEL;

  // Validate channel ID against whitelist
  const safeChannelId = ALLOWED_CHANNELS.has(channelId) ? channelId : DEFAULT_CHANNEL;

  const upstreamUrl = `${TOOLS_SERVICE_URL}/discord/messages/stream?guildId=${GUILD_ID}&channelId=${safeChannelId}&limit=${limit}&includeBots=true`;

  try {
    const upstream = await fetch(upstreamUrl, {
      // Disable Next.js caching — this is a live stream
      cache: "no-store",
      // Forward the abort signal so the upstream connection
      // closes when the browser disconnects
      signal: request.signal,
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "Failed to connect to message stream" },
        { status: upstream.status },
      );
    }

    // Pipe the upstream SSE stream through URL rewriting so
    // private MinIO addresses never reach the browser.
    return new Response(rewriteStream(upstream.body), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    // AbortError is expected when the client disconnects — don't log it
    if (error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }

    console.error("[discord/stream] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
