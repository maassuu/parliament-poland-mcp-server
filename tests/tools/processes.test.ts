import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getProcessesTool } from "../../src/tools/processes.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getProcessesTool", () => {
  it("passes filters and paging to the API", async () => {
    request.mockResolvedValue(okResult([{ number: "1" }]));

    const result = await getProcessesTool.handler({
      term: 10,
      offset: 0,
      limit: 1,
      title: "kodeks",
      documentType: "projekt ustawy",
      passed: true,
      modifiedSince: "2024-01-01T00:00:00",
      sort_by: "-number",
    });

    expect(request).toHaveBeenCalledWith("/term10/processes", {
      offset: 0,
      limit: 1,
      title: "kodeks",
      documentType: "projekt ustawy",
      passed: true,
      modifiedSince: "2024-01-01T00:00:00",
      sort_by: "-number",
    });
    expect(textOf(result)).toContain("Fetched the list of processes for term 10:");
    expect(textOf(result)).toContain("To fetch more, call again with offset=1.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await getProcessesTool.handler({ term: 10 }), "Failed to fetch the list of processes for term 10.");
  });
});
