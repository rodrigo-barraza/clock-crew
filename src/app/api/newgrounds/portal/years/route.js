// ============================================================
// Clock Crew — Newgrounds Portal Years API Proxy
// ============================================================
// Proxies year dropdown data requests to tools-api /newgrounds/portal/years.
// ============================================================

const TOOLS_API_URL = process.env.TOOLS_API_URL || "http://192.168.86.2:5590";

export async function GET() {
  try {
    const url = `${TOOLS_API_URL}/newgrounds/portal/years`;
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
