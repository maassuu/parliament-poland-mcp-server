import { dateSchema, limitSchema, offsetSchema, segment } from "../../src/tools/common.js";

describe("segment", () => {
  it("encodes characters that would change the request path", () => {
    expect(segment("../MP")).toBe("..%2FMP");
    expect(segment("a b?c")).toBe("a%20b%3Fc");
    expect(segment(12)).toBe("12");
  });
});

describe("shared schemas", () => {
  it("accepts offset 0 and rejects negative offsets", () => {
    expect(offsetSchema.safeParse(0).success).toBe(true);
    expect(offsetSchema.safeParse(-1).success).toBe(false);
  });

  it("requires a positive limit", () => {
    expect(limitSchema.safeParse(1).success).toBe(true);
    expect(limitSchema.safeParse(0).success).toBe(false);
  });

  it("accepts only YYYY-MM-DD dates", () => {
    expect(dateSchema.safeParse("2023-11-13").success).toBe(true);
    expect(dateSchema.safeParse("13.11.2023").success).toBe(false);
    expect(dateSchema.safeParse("2023-11-13T10:00:00").success).toBe(false);
  });
});
