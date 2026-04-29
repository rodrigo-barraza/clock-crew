// ============================================================
// Clock Crew — Newgrounds Portal Clocks API Proxy
// ============================================================
// Proxies profile browse requests to clockcrew-api /newgrounds/portal/clocks.
// ============================================================

const CLOCK_CREW_SERVICE_URL = process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Forward all supported query params
  const params = new URLSearchParams();
  for (const key of ["q", "sort", "limit", "skip", "year"]) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  if (!params.has("limit")) params.set("limit", "60");

  try {
    const url = `${CLOCK_CREW_SERVICE_URL}/newgrounds/portal/clocks?${params}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch clocks data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[newgrounds/portal/clocks] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
