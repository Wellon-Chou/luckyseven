// Transport-level fetch failures (dropped WiFi, backgrounded tab, TLS hiccup)
// surface as "Load failed" in Safari/WebKit and "Failed to fetch" in Chrome.
// These are transient — the request never reached the server — so retrying
// almost always succeeds. Real errors (RLS, validation, "存档已满") are NOT
// transient and must surface immediately without retry.
export function isTransientError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /load failed|failed to fetch|network\s*error|the network connection was lost/i.test(
    message,
  );
}

// Retry a Supabase call while it keeps failing with a transient network error.
// supabase-js normally returns the fetch failure in `{ error }` rather than
// throwing, but a raw TypeError can still escape, so we handle both. Only the
// final result (success or a real/persistent error) is returned to the caller.
export async function withRetry<T extends { error: { message: string } | null }>(
  run: () => PromiseLike<T>,
  tries = 3,
): Promise<T> {
  let last: T | undefined;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 400ms, then 800ms.
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** (attempt - 1)));
    }
    try {
      last = await run();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      last = { error: { message } } as T;
    }
    if (!last.error || !isTransientError(last.error.message)) return last;
  }
  return last as T;
}
