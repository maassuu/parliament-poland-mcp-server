import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getInterpellationsTool, getInterpellationTool } from "../../src/tools/interpellations.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getInterpellationsTool", () => {
  it("passes the supported filters and paging to the API", async () => {
    request.mockResolvedValue(okResult([{ num: 1 }, { num: 2 }]));

    const result = await getInterpellationsTool.handler({
      term: 10,
      offset: 4,
      limit: 2,
      from: 277,
      to: "minister finansów",
      title: "podatek",
      since: "2024-01-01",
      till: "2024-02-01",
      delayed: true,
      modifiedSince: "2024-01-01T00:00:00",
      sort_by: "-num",
    });

    expect(request).toHaveBeenCalledWith("/term10/interpellations", {
      offset: 4,
      limit: 2,
      from: 277,
      to: "minister finansów",
      title: "podatek",
      since: "2024-01-01",
      till: "2024-02-01",
      delayed: true,
      modifiedSince: "2024-01-01T00:00:00",
      sort_by: "-num",
    });
    expect(textOf(result)).toContain("Fetched the list of interpellations for term 10:");
    expect(textOf(result)).toContain("Showing 2 items starting at offset 4. To fetch more, call again with offset=6.");
  });

  it("rejects filters the API does not support", () => {
    const schema = getInterpellationsTool.schema;
    expect(Object.keys(schema)).not.toEqual(expect.arrayContaining(["mp"]));
    expect(Object.keys(schema)).not.toEqual(expect.arrayContaining(["status"]));
    expect(schema.since.safeParse("01.01.2024").success).toBe(false);
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getInterpellationsTool.handler({ term: 10 }),
      "Failed to fetch the list of interpellations for term 10."
    );
  });
});

describe("getInterpellationTool", () => {
  it("returns the interpellation details", async () => {
    request.mockResolvedValue(okResult({ num: 5 }));

    const result = await getInterpellationTool.handler({ term: 10, id: 5 });

    expect(request).toHaveBeenCalledWith("/term10/interpellations/5");
    expect(textOf(result)).toContain("Fetched details for interpellation 5 in term 10:");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getInterpellationTool.handler({ term: 10, id: 5 }),
      "Failed to fetch details for interpellation 5 in term 10."
    );
  });
});
