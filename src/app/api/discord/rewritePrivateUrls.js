// ============================================================
// Clock Crew — Private Network URL Sanitizer
// ============================================================
// Rewrites internal MinIO URLs in API responses so browsers
// never attempt to load resources from private IP addresses.
// This prevents Chrome's Private Network Access (PNA) prompt.
//
// Before: http://localhost:9000/discord-media/media/<key>
// After:  /api/media/discord-media/media/<key>
// ============================================================

const MINIO_INTERNAL_URL =
  process.env.MINIO_INTERNAL_URL || "http://localhost:9000";

/**
 * Replace all occurrences of the internal MinIO URL with the
 * public-facing `/api/media` proxy path in a string.
 * @param {string} text
 * @returns {string}
 */
export function rewritePrivateUrls(text) {
  return text.replaceAll(MINIO_INTERNAL_URL, "/api/media");
}

/**
 * Wrap a ReadableStream to rewrite private URLs on the fly.
 * Used for SSE streams that pipe data directly to the browser.
 * @param {ReadableStream} stream
 * @returns {ReadableStream}
 */
export function rewriteStream(stream) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        controller.enqueue(encoder.encode(rewritePrivateUrls(text)));
      },
      flush(controller) {
        // Flush any remaining bytes from the decoder
        const remaining = decoder.decode();
        if (remaining) {
          controller.enqueue(encoder.encode(rewritePrivateUrls(remaining)));
        }
      },
    }),
  );
}
