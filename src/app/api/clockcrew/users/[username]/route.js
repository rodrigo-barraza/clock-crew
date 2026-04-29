// ============================================================
// Clock Crew — Composite Member Profile API Proxy
// ============================================================
// Proxies to the new /clockcrew/members/:username endpoint which
// aggregates ALL data: CC forum, NG profile, movies, games,
// audio, art, reviews, favorites, fans, posts, threads, and
// the LLM-generated profile summary.
// ============================================================

const CLOCK_CREW_SERVICE_URL = process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export async function GET(_request, { params }) {
  const { username } = await params;

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${CLOCK_CREW_SERVICE_URL}/clockcrew/members/${encodeURIComponent(username)}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return Response.json(
        { error: body.error || `Failed to load profile (${res.status})` },
        { status: res.status },
      );
    }

    const data = await res.json();

    // If the endpoint returned an error object (member not found)
    if (data.error) {
      return Response.json({ error: data.error }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("[clockcrew/users/:username] Error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
