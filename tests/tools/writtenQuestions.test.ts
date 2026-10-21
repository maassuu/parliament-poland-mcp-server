import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getWrittenQuestionsTool } from "../../src/tools/writtenQuestions.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getWrittenQuestionsTool", () => {
  it("calls the writtenQuestions endpoint with filters and paging", async () => {
    request.mockResolvedValue(okResult([{ num: 1 }]));

    const result = await getWrittenQuestionsTool.handler({
      term: 10,
      offset: 0,
      limit: 5,
      sort_by: "-num",
      title: "szpital",
      from: 277,
      to: "minister zdrowia",
      since: "2024-01-01",
      till: "2024-02-01",
      delayed: false,
      modifiedSince: "2024-01-01T00:00:00",
    });

    expect(request).toHaveBeenCalledWith("/term10/writtenQuestions", {
      offset: 0,
      limit: 5,
      sort_by: "-num",
      title: "szpital",
      from: 277,
      to: "minister zdrowia",
      since: "2024-01-01",
      till: "2024-02-01",
      delayed: false,
      modifiedSince: "2024-01-01T00:00:00",
    });
    expect(textOf(result)).toContain("Fetched the list of written questions for term 10:");
    expect(textOf(result)).toContain("Showing 1 items starting at offset 0.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getWrittenQuestionsTool.handler({ term: 10 }),
      "Failed to fetch the list of written questions for term 10."
    );
  });
});
