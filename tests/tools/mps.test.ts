import { jest } from "@jest/globals";
import { makeSejmImageRequest, makeSejmRequest } from "../../src/utils/api.js";
import { getMpPhotoTool, getMpsTool, getMpTool, getMpVotingsTool } from "../../src/tools/mps.js";
import { expectFailure, type MockFn, notFoundResult, okResult, textOf } from "../helpers.js";

jest.mock("../../src/utils/api.js", () => ({
  makeSejmRequest: jest.fn(),
  makeSejmImageRequest: jest.fn(),
}));

const request = makeSejmRequest as jest.MockedFunction<MockFn>;
const imageRequest = makeSejmImageRequest as jest.MockedFunction<MockFn>;

beforeEach(() => {
  request.mockReset();
  imageRequest.mockReset();
});

describe("getMpTool", () => {
  it("returns the MP details", async () => {
    request.mockResolvedValue(okResult({ id: 1, lastName: "Kowalski" }));

    const result = await getMpTool.handler({ term: 10, id: 1 });

    expect(request).toHaveBeenCalledWith("/term10/MP/1");
    expect(textOf(result)).toBe(
      'Fetched information about the MP with ID 1 in term 10:\n\n{"id":1,"lastName":"Kowalski"}'
    );
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getMpTool.handler({ term: 10, id: 1 }),
      "Failed to fetch information about the MP with ID 1 in term 10."
    );
  });
});

describe("getMpsTool", () => {
  it("pages the full MP list locally because the API ignores offset/limit", async () => {
    request.mockResolvedValue(okResult([{ id: 1 }, { id: 2 }, { id: 3 }]));

    const result = await getMpsTool.handler({ term: 10, offset: 0, limit: 2 });

    expect(request).toHaveBeenCalledWith("/term10/MP");
    expect(textOf(result)).toContain("Fetched the list of MPs for term 10:");
    expect(textOf(result)).toContain("Showing items 1-2 of 3. To fetch more, call again with offset=2.");
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(await getMpsTool.handler({ term: 10 }), "Failed to fetch the list of MPs for term 10.");
  });
});

describe("getMpPhotoTool", () => {
  it("returns the photo as image content", async () => {
    imageRequest.mockResolvedValue(okResult({ data: "AQID", mimeType: "image/jpeg" }));

    const result = await getMpPhotoTool.handler({ term: 10, id: 1 });

    expect(imageRequest).toHaveBeenCalledWith("/term10/MP/1/photo");
    expect(result.content).toEqual([
      { type: "text", text: "Photo of the MP with ID 1 in term 10:" },
      { type: "image", data: "AQID", mimeType: "image/jpeg" },
    ]);
  });

  it("requests the thumbnail when mini is set", async () => {
    imageRequest.mockResolvedValue(okResult({ data: "AQID", mimeType: "image/jpeg" }));

    await getMpPhotoTool.handler({ term: 10, id: 1, mini: true });

    expect(imageRequest).toHaveBeenCalledWith("/term10/MP/1/photo-mini");
  });

  it("returns a failure message when the API fails", async () => {
    imageRequest.mockResolvedValue(notFoundResult);

    expectFailure(
      await getMpPhotoTool.handler({ term: 10, id: 1 }),
      "Failed to fetch the photo of the MP with ID 1 in term 10."
    );
  });
});

describe("getMpVotingsTool", () => {
  it("returns the MP's votes for a sitting day", async () => {
    request.mockResolvedValue(okResult([{ votingNumber: 1, vote: "YES" }]));

    const result = await getMpVotingsTool.handler({ term: 10, id: 1, sitting: 1, date: "2023-11-13" });

    expect(request).toHaveBeenCalledWith("/term10/MP/1/votings/1/2023-11-13");
    expect(textOf(result)).toContain("Fetched votes of the MP with ID 1 on sitting 1 (2023-11-13) in term 10:");
    expect(textOf(result)).toContain('[{"votingNumber":1,"vote":"YES"}]');
  });

  it("returns a failure message when the API fails", async () => {
    request.mockResolvedValue(notFoundResult);

    expectFailure(
      await getMpVotingsTool.handler({ term: 10, id: 1, sitting: 1, date: "2023-11-13" }),
      "Failed to fetch votes of the MP with ID 1 on sitting 1 (2023-11-13) in term 10."
    );
  });
});
