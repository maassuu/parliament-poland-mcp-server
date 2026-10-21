import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getBilateralGroupsTool } from "../../src/tools/bilateralGroups.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getBilateralGroupsTool", () => {
  it("fetches the groups of the given term", async () => {
    request.mockResolvedValue(okResult([{ id: 532 }]));

    const result = await getBilateralGroupsTool.handler({ term: 10 });

    expect(request).toHaveBeenCalledWith("/term10/bilateralGroups");
    expect(textOf(result)).toContain("Fetched the list of bilateral groups for term 10:");
    expect(textOf(result)).toContain('[{"id":532}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getBilateralGroupsTool.handler({ term: 10 }),
      "Failed to fetch the list of bilateral groups for term 10."
    );
  });
});
