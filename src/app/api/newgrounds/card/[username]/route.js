// ============================================================
// Clock Crew — Newgrounds Profile Card API Proxy
// ============================================================
// Proxies enriched profile card requests to clockcrew-api.
// ============================================================

const CLOCK_CREW_SERVICE_URL = process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export async function GET(request, { params }) {
  const { username } = await params;

  try {
    const url = `${CLOCK_CREW_SERVICE_URL}/newgrounds/portal/${encodeURIComponent(username)}/card`;
    const res = await fetch(url, { next: { revalidate: 600 } });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch card data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[newgrounds/card] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
