import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getPrintsTool, getPrintTool } from "../../src/tools/prints.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getPrintsTool", () => {
  it("sorts on the API side and pages locally", async () => {
    request.mockResolvedValue(okResult([{ number: "3" }, { number: "2" }, { number: "1" }]));

    const result = await getPrintsTool.handler({ term: 10, limit: 2, sort_by: "-number" });

    expect(request).toHaveBeenCalledWith("/term10/prints", { sort_by: "-number" });
    expect(textOf(result)).toContain("Fetched the list of prints for term 10:");
    expect(textOf(result)).toContain("Showing items 1-2 of 3. To fetch more, call again with offset=2.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await getPrintsTool.handler({ term: 10 }), "Failed to fetch the list of prints for term 10.");
  });
});

describe("getPrintTool", () => {
  it("returns the print details", async () => {
    request.mockResolvedValue(okResult({ number: "128" }));

    const result = await getPrintTool.handler({ term: 10, printNumber: 128 });

    expect(request).toHaveBeenCalledWith("/term10/prints/128");
    expect(textOf(result)).toContain("Fetched details for print 128 in term 10:");
  });

  it("supports print numbers with a letter suffix", async () => {
    request.mockResolvedValue(okResult({ number: "128-A" }));

    await getPrintTool.handler({ term: 10, printNumber: "128-A" });

    expect(request).toHaveBeenCalledWith("/term10/prints/128-A");
    expect(getPrintTool.schema.printNumber.safeParse("128-BA").success).toBe(true);
    expect(getPrintTool.schema.printNumber.safeParse("../x").success).toBe(false);
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getPrintTool.handler({ term: 10, printNumber: 128 }),
      "Failed to fetch details for print 128 in term 10."
    );
  });
});
