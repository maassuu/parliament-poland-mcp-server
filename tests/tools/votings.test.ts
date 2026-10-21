import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";
import { getVotingsTool, getVotingTool, searchVotingsTool } from "../../src/tools/votings.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
});

describe("getVotingsTool", () => {
  it("pages the votings of a sitting locally", async () => {
    request.mockResolvedValue(okResult([{ votingNumber: 1 }, { votingNumber: 2 }]));

    const result = await getVotingsTool.handler({ term: 10, proceeding: 1, limit: 1 });

    expect(request).toHaveBeenCalledWith("/term10/votings/1");
    expect(textOf(result)).toContain("Fetched the list of votings for sitting 1 in term 10:");
    expect(textOf(result)).toContain("Showing items 1-1 of 2. To fetch more, call again with offset=1.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getVotingsTool.handler({ term: 10, proceeding: 1 }),
      "Failed to fetch the list of votings for sitting 1 in term 10."
    );
  });
});

describe("getVotingTool", () => {
  const voting = {
    votingNumber: 3,
    votes: [
      { MP: 1, club: "PiS", vote: "NO" },
      { MP: 2, club: "KO", vote: "YES" },
    ],
  };

  it("returns the voting with all votes", async () => {
    request.mockResolvedValue(okResult(voting));

    const result = await getVotingTool.handler({ term: 10, sitting: 1, votingNumber: 3 });

    expect(request).toHaveBeenCalledWith("/term10/votings/1/3");
    expect(textOf(result)).toBe(`Fetched voting 3 of sitting 1 in term 10:\n\n${JSON.stringify(voting)}`);
  });

  it("filters votes by club", async () => {
    request.mockResolvedValue(okResult(voting));

    const result = await getVotingTool.handler({ term: 10, sitting: 1, votingNumber: 3, club: "KO" });

    expect(textOf(result)).toContain('"votes":[{"MP":2,"club":"KO","vote":"YES"}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getVotingTool.handler({ term: 10, sitting: 1, votingNumber: 3 }),
      "Failed to fetch voting 3 of sitting 1 in term 10."
    );
  });
});

describe("searchVotingsTool", () => {
  it("passes the search criteria to the API", async () => {
    request.mockResolvedValue(okResult([{ votingNumber: 1 }]));

    const result = await searchVotingsTool.handler({
      term: 10,
      title: "energii",
      dateFrom: "2024-01-01",
      dateTo: "2024-06-01",
      proceeding: 5,
      offset: 0,
      limit: 10,
    });

    expect(request).toHaveBeenCalledWith("/term10/votings/search", {
      title: "energii",
      dateFrom: "2024-01-01",
      dateTo: "2024-06-01",
      proceeding: 5,
      offset: 0,
      limit: 10,
    });
    expect(textOf(result)).toContain("Found votings in term 10:");
    expect(textOf(result)).toContain("Showing 1 items starting at offset 0.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await searchVotingsTool.handler({ term: 10 }), "Failed to search votings in term 10.");
  });
});
