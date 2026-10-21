import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getTermsTool } from "../../src/tools/terms.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getTermsTool", () => {
  it("fetches all terms and pages them locally", async () => {
    request.mockResolvedValue(okResult([{ num: 10 }, { num: 9 }, { num: 8 }]));

    const result = await getTermsTool.handler({ offset: 1, limit: 1 });

    expect(request).toHaveBeenCalledWith("/term");
    expect(textOf(result)).toContain("Fetched the list of Sejm terms:");
    expect(textOf(result)).toContain("Showing items 2-2 of 3. To fetch more, call again with offset=2.");
    expect(textOf(result)).toContain('[{"num":9}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await getTermsTool.handler({}), "Failed to fetch the list of terms.");
  });
});
