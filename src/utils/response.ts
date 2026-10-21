import type { SejmApiError, SejmImage } from "./api.js";

/** Upper bound for a single tool response, so one call cannot flood the model's context. */
export const MAX_RESPONSE_CHARS = 80_000;
export const DEFAULT_PAGE_SIZE = 50;

export type ToolContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export interface ToolResponse {
  [key: string]: unknown;
  content: ToolContent[];
  isError?: boolean;
}

export interface PageOptions {
  offset?: number;
  limit?: number;
}

function toJson(data: unknown): string {
  return JSON.stringify(data);
}

function textResponse(text: string): ToolResponse {
  return { content: [{ type: "text", text }] };
}

export function truncateText(text: string, maxChars = MAX_RESPONSE_CHARS): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[Response truncated: showing ${maxChars} of ${text.length} characters. Narrow the request to get the rest.]`;
}

export function errorResponse(message: string, error: SejmApiError): ToolResponse {
  return {
    content: [{ type: "text", text: `${message}\n\nError: ${error.message}` }],
    isError: true,
  };
}

export function dataResponse(message: string, data: unknown): ToolResponse {
  return textResponse(`${message}\n\n${truncateText(toJson(data))}`);
}

export function plainTextResponse(message: string, text: string): ToolResponse {
  return textResponse(`${message}\n\n${truncateText(text)}`);
}

export function imageResponse(message: string, image: SejmImage): ToolResponse {
  return {
    content: [
      { type: "text", text: message },
      { type: "image", data: image.data, mimeType: image.mimeType },
    ],
  };
}

/** Largest prefix of `items` whose JSON fits in MAX_RESPONSE_CHARS (at least one item). */
function fitItems<T>(items: T[]): T[] {
  let low = 1;
  let high = items.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (toJson(items.slice(0, mid)).length <= MAX_RESPONSE_CHARS) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return items.slice(0, low);
}

function pageResponse(
  message: string,
  page: unknown[],
  offset: number,
  limit: number,
  total?: number
): ToolResponse {
  if (page.length === 0) {
    const totalInfo = total === undefined ? "" : ` (total: ${total})`;
    return textResponse(`${message}\n\nNo items found at offset ${offset}${totalInfo}.\n\n[]`);
  }

  const shown = fitItems(page);
  const reduced = shown.length < page.length;
  const end = offset + shown.length;
  const hasMore = total === undefined ? reduced || page.length >= limit : end < total;

  let summary = total === undefined
    ? `Showing ${shown.length} items starting at offset ${offset}`
    : `Showing items ${offset + 1}-${end} of ${total}`;
  if (reduced) {
    summary += " (reduced to fit the response size limit)";
  }
  summary += ".";
  if (hasMore) {
    summary += ` To fetch more, call again with offset=${end}.`;
  }

  return textResponse(`${message}\n\n${summary}\n\n${truncateText(toJson(shown))}`);
}

/** Pages a complete list locally - for endpoints that ignore offset/limit. */
export function listResponse(
  message: string,
  items: unknown[],
  { offset = 0, limit = DEFAULT_PAGE_SIZE }: PageOptions = {}
): ToolResponse {
  return pageResponse(message, items.slice(offset, offset + limit), offset, limit, items.length);
}

/** Formats a page the API has already cut with its own offset/limit. */
export function apiPageResponse(
  message: string,
  page: unknown[],
  { offset = 0, limit = DEFAULT_PAGE_SIZE }: PageOptions = {}
): ToolResponse {
  return pageResponse(message, page, offset, limit);
}
