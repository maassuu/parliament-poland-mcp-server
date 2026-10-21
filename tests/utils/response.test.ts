import {
  apiPageResponse,
  dataResponse,
  DEFAULT_PAGE_SIZE,
  errorResponse,
  imageResponse,
  listResponse,
  MAX_RESPONSE_CHARS,
  plainTextResponse,
  truncateText,
} from "../../src/utils/response.js";

function textOf(result: { content: { type: string; text?: string }[] }): string {
  return result.content[0].text ?? "";
}

const range = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

describe("errorResponse", () => {
  it("returns the message with the error and the isError flag", () => {
    const result = errorResponse("Failed.", { status: 404, message: "HTTP 404" });

    expect(textOf(result)).toBe("Failed.\n\nError: HTTP 404");
    expect(result.isError).toBe(true);
  });
});

describe("dataResponse", () => {
  it("serializes data as compact JSON", () => {
    const result = dataResponse("Fetched:", { a: 1, b: [2] });

    expect(textOf(result)).toBe('Fetched:\n\n{"a":1,"b":[2]}');
    expect(result.isError).toBeUndefined();
  });

  it("truncates data above the size limit", () => {
    const result = dataResponse("Fetched:", { text: "x".repeat(MAX_RESPONSE_CHARS) });

    expect(textOf(result)).toContain("[Response truncated: showing 80000 of");
  });
});

describe("plainTextResponse", () => {
  it("returns the text as is", () => {
    expect(textOf(plainTextResponse("Statement:", "Hello"))).toBe("Statement:\n\nHello");
  });
});

describe("truncateText", () => {
  it("leaves short text untouched", () => {
    expect(truncateText("abc", 5)).toBe("abc");
  });

  it("cuts long text and explains why", () => {
    expect(truncateText("abcdef", 3)).toBe(
      "abc\n\n[Response truncated: showing 3 of 6 characters. Narrow the request to get the rest.]"
    );
  });
});

describe("imageResponse", () => {
  it("returns a caption and image content", () => {
    const result = imageResponse("Photo:", { data: "AQID", mimeType: "image/jpeg" });

    expect(result.content).toEqual([
      { type: "text", text: "Photo:" },
      { type: "image", data: "AQID", mimeType: "image/jpeg" },
    ]);
  });
});

describe("listResponse", () => {
  it("returns the first default page with a hint for the next one", () => {
    const text = textOf(listResponse("Fetched:", range(120)));

    expect(text).toContain(`Showing items 1-${DEFAULT_PAGE_SIZE} of 120. To fetch more, call again with offset=50.`);
    expect(JSON.parse(text.split("\n\n")[2])).toHaveLength(DEFAULT_PAGE_SIZE);
  });

  it("applies offset and limit locally", () => {
    const text = textOf(listResponse("Fetched:", range(10), { offset: 2, limit: 3 }));

    expect(text).toContain("Showing items 3-5 of 10. To fetch more, call again with offset=5.");
    expect(text).toContain('[{"id":3},{"id":4},{"id":5}]');
  });

  it("does not suggest more items on the last page", () => {
    const text = textOf(listResponse("Fetched:", range(10), { offset: 8, limit: 5 }));

    expect(text).toContain("Showing items 9-10 of 10.");
    expect(text).not.toContain("To fetch more");
  });

  it("reports an offset past the end of the list", () => {
    const text = textOf(listResponse("Fetched:", range(3), { offset: 5 }));

    expect(text).toBe("Fetched:\n\nNo items found at offset 5 (total: 3).\n\n[]");
  });

  it("returns fewer items when the page does not fit the size limit", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i, text: "x".repeat(30_000) }));

    const text = textOf(listResponse("Fetched:", items));

    expect(text).toContain(
      "Showing items 1-2 of 10 (reduced to fit the response size limit). To fetch more, call again with offset=2."
    );
    expect(text.length).toBeLessThan(MAX_RESPONSE_CHARS + 500);
  });

  it("truncates a single item that exceeds the size limit on its own", () => {
    const items = [{ text: "x".repeat(MAX_RESPONSE_CHARS + 10) }, { text: "y" }];

    const text = textOf(listResponse("Fetched:", items));

    expect(text).toContain("Showing items 1-1 of 2 (reduced to fit the response size limit).");
    expect(text).toContain("[Response truncated:");
  });
});

describe("apiPageResponse", () => {
  it("suggests the next offset when the API returned a full page", () => {
    const text = textOf(apiPageResponse("Fetched:", range(5), { offset: 10, limit: 5 }));

    expect(text).toContain("Showing 5 items starting at offset 10. To fetch more, call again with offset=15.");
  });

  it("does not suggest more items after a partial page", () => {
    const text = textOf(apiPageResponse("Fetched:", range(3), { limit: 5 }));

    expect(text).toContain("Showing 3 items starting at offset 0.");
    expect(text).not.toContain("To fetch more");
  });

  it("reports an empty page", () => {
    expect(textOf(apiPageResponse("Fetched:", []))).toBe("Fetched:\n\nNo items found at offset 0.\n\n[]");
  });
});
