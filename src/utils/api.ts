
const SEJM_API_BASE = "https://api.sejm.gov.pl/sejm";
export const REQUEST_TIMEOUT_MS = 15_000;

export interface SejmApiError {
  /** HTTP status code; absent for timeouts and network failures. */
  status?: number;
  message: string;
}

export type SejmApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SejmApiError };

export type SejmQueryParams = Record<string, string | number | boolean | undefined>;

export interface SejmImage {
  /** Base64-encoded image bytes. */
  data: string;
  mimeType: string;
}

async function requestSejm<T>(
  endpoint: string,
  params: SejmQueryParams | undefined,
  accept: string,
  parse: (res: Response) => Promise<T>
): Promise<SejmApiResult<T>> {
  const url = new URL(`${SEJM_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = { Accept: accept };
  let error: SejmApiError;
  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status === 204) {
      // The API answers 204 instead of 404 for some unknown IDs (e.g. committee codes).
      error = { status: 204, message: `No data found for ${url.pathname}` };
    } else if (res.ok) {
      return { ok: true, data: await parse(res) };
    } else {
      error = {
        status: res.status,
        message: `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""} for ${url.pathname}`,
      };
    }
  } catch (err) {
    // AbortSignal.timeout rejects with a DOMException, which is not always an Error instance.
    const { name, message } = (err ?? {}) as { name?: string; message?: string };
    error = {
      message: name === "TimeoutError"
        ? `Request to ${url.pathname} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : `Request to ${url.pathname} failed: ${message ?? String(err)}`,
    };
  }

  console.error("Sejm API request error:", error.message);
  return { ok: false, error };
}

export function makeSejmRequest<T>(
  endpoint: string,
  params?: SejmQueryParams
): Promise<SejmApiResult<T>> {
  return requestSejm(endpoint, params, "application/json", async (res) => (await res.json()) as T);
}

/** Fetches a non-JSON resource (e.g. an HTML statement body) as text. */
export function makeSejmTextRequest(
  endpoint: string,
  params?: SejmQueryParams
): Promise<SejmApiResult<string>> {
  return requestSejm(endpoint, params, "text/html, text/plain, */*", (res) => res.text());
}

/** Fetches an image (e.g. an MP photo) as base64. */
export function makeSejmImageRequest(endpoint: string): Promise<SejmApiResult<SejmImage>> {
  return requestSejm(endpoint, undefined, "image/*", async (res) => ({
    data: Buffer.from(await res.arrayBuffer()).toString("base64"),
    mimeType: res.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg",
  }));
}
