// ============================================================
// Clock Crew — Newgrounds Profile Card API Proxy
// ============================================================
// Proxies enriched profile card requests to tools-api.
// ============================================================

const TOOLS_API_URL = process.env.TOOLS_API_URL || "http://192.168.86.2:5590";

export async function GET(request, { params }) {
  const { username } = await params;

  try {
    const url = `${TOOLS_API_URL}/newgrounds/portal/${encodeURIComponent(username)}/card`;
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
