import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getProceedingsTool, getProceedingTool } from "../../src/tools/proceedings.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getProceedingsTool", () => {
  it("omits agendas from the list", async () => {
    request.mockResolvedValue(okResult([{ number: 1, title: "1. Posiedzenie", agenda: "<p>long</p>" }]));

    const result = await getProceedingsTool.handler({ term: 10 });

    expect(request).toHaveBeenCalledWith("/term10/proceedings");
    expect(textOf(result)).toContain("Fetched the list of proceedings for term 10:");
    expect(textOf(result)).toContain('[{"number":1,"title":"1. Posiedzenie"}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getProceedingsTool.handler({ term: 10 }),
      "Failed to fetch the list of proceedings for term 10."
    );
  });
});

describe("getProceedingTool", () => {
  it("returns the proceeding with its agenda as plain text", async () => {
    request.mockResolvedValue(okResult({ number: 1, agenda: "<ol><li>Ślubowanie</li></ol>" }));

    const result = await getProceedingTool.handler({ term: 10, proceeding: 1 });

    expect(request).toHaveBeenCalledWith("/term10/proceedings/1");
    expect(textOf(result)).toBe('Fetched proceeding 1 for term 10:\n\n{"number":1,"agenda":"- Ślubowanie"}');
  });

  it("handles a proceeding without an agenda", async () => {
    request.mockResolvedValue(okResult({ number: 2 }));

    const result = await getProceedingTool.handler({ term: 10, proceeding: 2 });

    expect(textOf(result)).toContain('{"number":2}');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getProceedingTool.handler({ term: 10, proceeding: 1 }),
      "Failed to fetch proceeding 1 for term 10."
    );
  });
});
