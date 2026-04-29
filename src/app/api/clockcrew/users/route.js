// ============================================================
// Clock Crew — User Listing API Proxy
// ============================================================
// Proxies GET requests to clockcrew-api /clockcrew/users.
// Supports ?limit= and ?q= query params.
// ============================================================

const CLOCK_CREW_SERVICE_URL = process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  const limit = searchParams.get("limit");
  const q = searchParams.get("q");
  if (limit) params.set("limit", limit);
  if (q) params.set("q", q);

  try {
    const url = `${CLOCK_CREW_SERVICE_URL}/clockcrew/users?${params}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch user listing" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[clockcrew/users] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
