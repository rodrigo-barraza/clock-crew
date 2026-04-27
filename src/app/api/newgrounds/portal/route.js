// ============================================================
// Clock Crew — Newgrounds Portal API Proxy
// ============================================================
// Proxies search/browse requests to tools-api /newgrounds/portal.
// ============================================================

const TOOLS_API_URL = process.env.TOOLS_API_URL || "http://192.168.86.2:5590";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Forward all supported query params
  const params = new URLSearchParams();
  for (const key of ["q", "username", "type", "sort", "limit", "skip"]) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  if (!params.has("limit")) params.set("limit", "60");

  try {
    const url = `${TOOLS_API_URL}/newgrounds/portal?${params}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch portal data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("[newgrounds/portal] Proxy error:", error.message);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
