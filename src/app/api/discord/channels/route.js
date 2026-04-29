// ============================================================
// Clock Crew — Discord Channels API Proxy
// ============================================================
// Proxies requests to Lupos for live Discord channel data.
// Falls back to tools-service message metadata when Lupos guild
// routes are unavailable.
// Guild is hardcoded for security.
// ============================================================

const LUPOS_BOT_URL = process.env.LUPOS_BOT_URL || "http://localhost:1337";
const TOOLS_SERVICE_URL = process.env.TOOLS_SERVICE_URL || "http://localhost:5590";
const GUILD_ID = "249010731910037507"; // Clock Crew

// Whitelisted channel IDs — must match DiscordChatComponent
const CHANNEL_IDS = ["671089694397956116", "676318241689436170"];

export async function GET() {
  // ── Try Lupos first (live Discord.js cache) ──────────────────
  try {
    const url = `${LUPOS_BOT_URL}/guild/channels?guildId=${GUILD_ID}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json();
      return Response.json(data);
    }
  } catch {
    // Lupos unavailable — fall through to tools-service fallback
  }

  // ── Fallback: derive channel names from tools-service messages ───
  // Fetch one message per whitelisted channel to extract the
  // channel.name and guild.name from the stored MongoDB data.
  try {
    const results = await Promise.allSettled(
      CHANNEL_IDS.map(async (channelId) => {
        const url = `${TOOLS_SERVICE_URL}/discord/messages/search?guildId=${GUILD_ID}&channelId=${channelId}&limit=1&mode=compact&includeBots=true`;
        const res = await fetch(url);
        if (!res.ok) return { channelId, name: channelId };
        const data = await res.json();
        const msg = data.messages?.[0];
        return {
          channelId,
          name: msg?.channel || channelId,
        };
      }),
    );

    // Also grab guild name from a full-mode message
    let guildName = null;
    try {
      const guildRes = await fetch(
        `${TOOLS_SERVICE_URL}/discord/messages/search?guildId=${GUILD_ID}&limit=1&includeBots=true`,
      );
      if (guildRes.ok) {
        const guildData = await guildRes.json();
        guildName = guildData.messages?.[0]?.guildName || null;
      }
    } catch {
      // non-critical
    }

    const channels = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => ({
        id: r.value.channelId,
        name: r.value.name,
        topic: null,
        parentId: null,
        parentName: null,
        position: CHANNEL_IDS.indexOf(r.value.channelId),
      }));

    return Response.json({
      guildId: GUILD_ID,
      guildName: guildName || "Clock Crew",
      channels,
    });
  } catch (error) {
    console.error("[discord/channels] Fallback error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
