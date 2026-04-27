// ============================================================
// Clock Crew — Discord Messages SSE Stream Proxy
// ============================================================
// Proxies the tools-api SSE stream to the browser. The browser
// connects via EventSource to this Next.js route, which in turn
// opens a persistent connection to tools-api and pipes the
// events through. Guild/channel are hardcoded for security.
// ============================================================

const TOOLS_API_URL = process.env.TOOLS_API_URL || "http://192.168.86.2:5590";
const GUILD_ID = "249010731910037507"; // Clock Crew
const CHANNEL_ID = "671089694397956116"; // #general-chat

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);

  const upstreamUrl = `${TOOLS_API_URL}/discord/messages/stream?guildId=${GUILD_ID}&channelId=${CHANNEL_ID}&limit=${limit}&includeBots=true`;

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

    // Pipe the upstream SSE stream directly to the browser
    return new Response(upstream.body, {
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
