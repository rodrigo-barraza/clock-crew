// ============================================================
// Clock Crew — Newgrounds Portal Years API Proxy
// ============================================================
// Proxies year dropdown data requests to clockcrew-api /newgrounds/portal/years.
// ============================================================

const CLOCK_CREW_SERVICE_URL = process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

export async function GET() {
  try {
    const url = `${CLOCK_CREW_SERVICE_URL}/newgrounds/portal/years`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch years data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[newgrounds/portal/years] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
