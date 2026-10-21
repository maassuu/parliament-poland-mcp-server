import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getClubTool, getClubsTool } from "../../src/tools/clubs.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getClubsTool", () => {
  it("pages the club list locally", async () => {
    request.mockResolvedValue(okResult([{ id: "KO" }, { id: "PiS" }]));

    const result = await getClubsTool.handler({ term: 10, offset: 1, limit: 2 });

    expect(request).toHaveBeenCalledWith("/term10/clubs");
    expect(textOf(result)).toContain("Fetched the list of clubs for term 10:");
    expect(textOf(result)).toContain("Showing items 2-2 of 2.");
    expect(textOf(result)).toContain('[{"id":"PiS"}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await getClubsTool.handler({ term: 10 }), "Failed to fetch the list of clubs for term 10.");
  });
});

describe("getClubTool", () => {
  it("returns the club details", async () => {
    request.mockResolvedValue(okResult({ id: "PiS" }));

    const result = await getClubTool.handler({ term: 10, id: "PiS" });

    expect(request).toHaveBeenCalledWith("/term10/clubs/PiS");
    expect(textOf(result)).toContain("Fetched details for club PiS in term 10:");
  });

  it("encodes the club ID in the path", async () => {
    request.mockResolvedValue(okResult({}));

    await getClubTool.handler({ term: 10, id: "../MP" });

    expect(request).toHaveBeenCalledWith("/term10/clubs/..%2FMP");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getClubTool.handler({ term: 10, id: "KO" }),
      "Failed to fetch details for club KO in term 10."
    );
  });
});
