import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getProcessTool } from "../../src/tools/process.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getProcessTool", () => {
  it("calls the processes endpoint", async () => {
    request.mockResolvedValue(okResult({ number: "2" }));

    const result = await getProcessTool.handler({ term: 10, processNumber: 2 });

    expect(request).toHaveBeenCalledWith("/term10/processes/2");
    expect(textOf(result)).toContain("Fetched process 2 for term 10:");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getProcessTool.handler({ term: 10, processNumber: 2 }),
      "Failed to fetch process 2 for term 10."
    );
  });
});
