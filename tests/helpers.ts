import type { ToolResponse } from "../src/utils/response.js";

export type MockFn = (...args: unknown[]) => Promise<unknown>;

export const okResult = (data: unknown) => ({ ok: true, data });

export const notFoundResult = {
  ok: false,
  error: { status: 404, message: "HTTP 404 Not Found for /sejm/test" },
};

export function textOf(result: ToolResponse): string {
  const first = result.content[0];
  return first.type === "text" ? first.text : "";
}

/** Asserts the standard failure shape shared by every tool. */
export function expectFailure(result: ToolResponse, message: string): void {
  expect(textOf(result)).toContain(message);
  expect(textOf(result)).toContain("Error: HTTP 404 Not Found");
  expect(result.isError).toBe(true);
}
