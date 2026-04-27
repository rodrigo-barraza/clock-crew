// ============================================================
// Clock Crew — Tenor oEmbed Proxy
// ============================================================
// Fetches the Tenor oEmbed JSON for a given tenor.com URL and
// returns the direct GIF media URL. The oEmbed thumbnail uses
// the "AAAAN" (nano PNG) variant — we swap to "AAAAC" (.gif)
// to get the full animated version.
//
// GET /api/tenor/oembed?url=https://tenor.com/view/...
// → { gifUrl, width, height, title }
// ============================================================

// In-memory cache to avoid repeated oEmbed fetches for the same URL
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function transformThumbnailToGif(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  // Tenor thumbnail pattern: https://media.tenor.com/{hash}AAAAN/{slug}.png
  // GIF variant:              https://media.tenor.com/{hash}AAAAC/{slug}.gif
  return thumbnailUrl
    .replace(/AAAAN\//, "AAAAC/")
    .replace(/\.png$/, ".gif");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenorUrl = searchParams.get("url");

  if (!tenorUrl || !tenorUrl.includes("tenor.com")) {
    return Response.json({ error: "Missing or invalid Tenor URL" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(tenorUrl);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return Response.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  try {
    const oembedUrl = `https://tenor.com/oembed?url=${encodeURIComponent(tenorUrl)}`;
    const res = await fetch(oembedUrl, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return Response.json({ error: "Tenor oEmbed request failed" }, { status: res.status });
    }

    const oembed = await res.json();
    const gifUrl = transformThumbnailToGif(oembed.thumbnail_url);

    const data = {
      gifUrl,
      thumbnailUrl: oembed.thumbnail_url,
      width: oembed.thumbnail_width || oembed.width || 400,
      height: oembed.thumbnail_height || oembed.height || 300,
      title: oembed.author_name || "Tenor GIF",
    };

    // Cache the result
    cache.set(tenorUrl, { data, ts: Date.now() });

    // Lazy cleanup — prevent unbounded growth
    if (cache.size > 500) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (now - val.ts > CACHE_TTL) cache.delete(key);
      }
    }

    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (error) {
    console.error("[tenor/oembed] Proxy error:", error.message);
    return Response.json({ error: "Failed to fetch Tenor data" }, { status: 502 });
  }
}
