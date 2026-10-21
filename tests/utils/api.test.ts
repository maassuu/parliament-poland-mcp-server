import { jest } from "@jest/globals";
import {
  makeSejmImageRequest,
  makeSejmRequest,
  makeSejmTextRequest,
  REQUEST_TIMEOUT_MS,
} from "../../src/utils/api.js";

const originalFetch = globalThis.fetch;
const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("makeSejmRequest", () => {
  it("builds the URL with params and returns JSON on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const result = await makeSejmRequest("/term", { offset: 2, limit: 5 });

    expect(result).toEqual({ ok: true, data: { ok: true } });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(String(url));
    expect(`${parsed.origin}${parsed.pathname}`).toBe(
      "https://api.sejm.gov.pl/sejm/term"
    );
    expect(parsed.searchParams.get("offset")).toBe("2");
    expect(parsed.searchParams.get("limit")).toBe("5");
    expect(options.headers).toEqual({ Accept: "application/json" });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the HTTP status and message when the response is not ok", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(
      new Response("", { status: 404, statusText: "Not Found" })
    );

    const result = await makeSejmRequest("/term10/speeches");

    expect(result).toEqual({
      ok: false,
      error: { status: 404, message: "HTTP 404 Not Found for /sejm/term10/speeches" },
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("aborts the request after the timeout", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const timeoutSpy = jest.spyOn(AbortSignal, "timeout");
    fetchMock.mockRejectedValue(
      new DOMException("The operation was aborted due to timeout", "TimeoutError")
    );

    const result = await makeSejmRequest("/term");

    expect(timeoutSpy).toHaveBeenCalledWith(REQUEST_TIMEOUT_MS);
    expect(result).toEqual({
      ok: false,
      error: { message: "Request to /sejm/term timed out after 15s" },
    });
  });

  it("returns the network error message without a status", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const result = await makeSejmRequest("/term");

    expect(result).toEqual({
      ok: false,
      error: { message: "Request to /sejm/term failed: fetch failed" },
    });
  });

  it("treats 204 No Content as a missing resource instead of failing to parse JSON", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await makeSejmRequest("/term10/committees/XYZ");

    expect(result).toEqual({
      ok: false,
      error: { status: 204, message: "No data found for /sejm/term10/committees/XYZ" },
    });
  });

  it("returns an error when a successful response is not valid JSON", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("<html></html>", { status: 200 }));

    const result = await makeSejmRequest("/term");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Request to /sejm/term failed:");
    }
  });
});

describe("makeSejmTextRequest", () => {
  it("returns the body as text", async () => {
    fetchMock.mockResolvedValue(new Response("<p>Hello</p>", { status: 200 }));

    const result = await makeSejmTextRequest("/term10/proceedings/1/2023-11-13/transcripts/1");

    expect(result).toEqual({ ok: true, data: "<p>Hello</p>" });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.headers).toEqual({ Accept: "text/html, text/plain, */*" });
  });
});

describe("makeSejmImageRequest", () => {
  it("returns the image as base64 with its mime type", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/jpeg;charset=UTF-8" },
      })
    );

    const result = await makeSejmImageRequest("/term10/MP/1/photo");

    expect(result).toEqual({ ok: true, data: { data: "AQID", mimeType: "image/jpeg" } });
  });

  it("returns an error for a missing photo", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("", { status: 404, statusText: "Not Found" }));

    const result = await makeSejmImageRequest("/term10/MP/999/photo");

    expect(result).toEqual({
      ok: false,
      error: { status: 404, message: "HTTP 404 Not Found for /sejm/term10/MP/999/photo" },
    });
  });
});
