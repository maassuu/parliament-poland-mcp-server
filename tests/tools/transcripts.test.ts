import { jest } from "@jest/globals";
import { makeSejmRequest, makeSejmTextRequest } from "../../src/utils/api.js";
import { getTranscriptStatementTool, getTranscriptsTool } from "../../src/tools/transcripts.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
  makeSejmTextRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;
const textRequest = makeSejmTextRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
  textRequest.mockReset();
});

const day = { term: 10, proceeding: 1, date: "2023-11-13" };

describe("getTranscriptsTool", () => {
  it("returns the statements of a sitting day", async () => {
    request.mockResolvedValue(
      okResult({ proceedingNum: 1, date: "2023-11-13", statements: [{ num: 0 }, { num: 1 }] })
    );

    const result = await getTranscriptsTool.handler({ ...day, limit: 1 });

    expect(request).toHaveBeenCalledWith("/term10/proceedings/1/2023-11-13/transcripts");
    expect(textOf(result)).toContain("Fetched the statements of sitting 1 (2023-11-13) in term 10:");
    expect(textOf(result)).toContain("Showing items 1-1 of 2. To fetch more, call again with offset=1.");
  });

  it("handles a day without statements", async () => {
    request.mockResolvedValue(okResult({ proceedingNum: 1, date: "2023-11-13" }));

    const result = await getTranscriptsTool.handler(day);

    expect(textOf(result)).toContain("No items found at offset 0 (total: 0).");
  });

  it("rejects dates in other formats", () => {
    expect(getTranscriptsTool.schema.date.safeParse("13-11-2023").success).toBe(false);
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getTranscriptsTool.handler(day),
      "Failed to fetch the transcript of sitting 1 (2023-11-13) in term 10."
    );
  });
});

describe("getTranscriptStatementTool", () => {
  it("returns the statement as plain text", async () => {
    textRequest.mockResolvedValue(
      okResult("<html><head><title>x</title></head><body><h2>Marszałek:</h2><p>Otwieram&nbsp;posiedzenie.</p></body></html>")
    );

    const result = await getTranscriptStatementTool.handler({ ...day, statementNum: 1 });

    expect(textRequest).toHaveBeenCalledWith("/term10/proceedings/1/2023-11-13/transcripts/1");
    expect(textOf(result)).toBe(
      "Fetched statement 1 of sitting 1 (2023-11-13) in term 10:\n\nMarszałek:\nOtwieram posiedzenie."
    );
  });

  it("returns a failure message when the API fails", async () => {
    textRequest.mockResolvedValue(notFoundResult);

    expectFailure(
      await getTranscriptStatementTool.handler({ ...day, statementNum: 1 }),
      "Failed to fetch statement 1 of sitting 1 (2023-11-13) in term 10."
    );
  });
});
