// src/services/fetchWithRetry.ts
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      // Retry on 5xx or 429
      if ((response.status >= 500 || response.status === 429) && i < retries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoff * (i + 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      // For other errors, break and throw
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, backoff * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}
