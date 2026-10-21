import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getCommitteeSittingsTool, getCommitteesTool, getCommitteeTool } from "../../src/tools/committees.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getCommitteesTool", () => {
  it("pages the committee list locally", async () => {
    request.mockResolvedValue(okResult([{ code: "ASW" }, { code: "SUE" }]));

    const result = await getCommitteesTool.handler({ term: 10, limit: 1 });

    expect(request).toHaveBeenCalledWith("/term10/committees");
    expect(textOf(result)).toContain("Fetched the list of committees for term 10:");
    expect(textOf(result)).toContain("Showing items 1-1 of 2. To fetch more, call again with offset=1.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getCommitteesTool.handler({ term: 10 }),
      "Failed to fetch the list of committees for term 10."
    );
  });
});

describe("getCommitteeTool", () => {
  it("returns the committee details", async () => {
    request.mockResolvedValue(okResult({ code: "SUE" }));

    const result = await getCommitteeTool.handler({ term: 10, id: "SUE" });

    expect(request).toHaveBeenCalledWith("/term10/committees/SUE");
    expect(textOf(result)).toContain("Fetched details for committee SUE in term 10:");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getCommitteeTool.handler({ term: 10, id: "SUE" }),
      "Failed to fetch details for committee SUE in term 10."
    );
  });
});

describe("getCommitteeSittingsTool", () => {
  it("returns the committee sittings", async () => {
    request.mockResolvedValue(okResult([{ num: 1 }, { num: 2 }]));

    const result = await getCommitteeSittingsTool.handler({ term: 10, id: "ASW", cancelled: true });

    expect(request).toHaveBeenCalledWith("/term10/committees/ASW/sittings", { cancelled: true });
    expect(textOf(result)).toContain("Fetched sittings of committee ASW in term 10:");
    expect(textOf(result)).toContain("Showing items 1-2 of 2.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getCommitteeSittingsTool.handler({ term: 10, id: "ASW" }),
      "Failed to fetch sittings of committee ASW in term 10."
    );
  });
});
