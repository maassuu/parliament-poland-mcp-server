import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getVideosTool } from "../../src/tools/videos.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getVideosTool", () => {
  it("passes filters and paging to the API", async () => {
    request.mockResolvedValue(okResult([{ unid: "a" }, { unid: "b" }]));

    const result = await getVideosTool.handler({
      term: 10,
      offset: 2,
      limit: 2,
      title: "budżet",
      type: "komisja",
      comm: "SUE",
      since: "2024-01-01",
      till: "2024-02-01",
    });

    expect(request).toHaveBeenCalledWith("/term10/videos", {
      offset: 2,
      limit: 2,
      title: "budżet",
      type: "komisja",
      comm: "SUE",
      since: "2024-01-01",
      till: "2024-02-01",
    });
    expect(textOf(result)).toContain("Fetched the list of video recordings for term 10:");
    expect(textOf(result)).toContain("To fetch more, call again with offset=4.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getVideosTool.handler({ term: 10 }),
      "Failed to fetch the list of video recordings for term 10."
    );
  });
});
