import { jest } from "@jest/globals";
import { makeSejmRequest } from "../../src/utils/api.js";
import type { ToolResponse } from "../../src/utils/response.js";
import { tools } from "../../src/tools/index.js";
import type { Proceeding, Term, VotingDetails } from "../../src/types/api.js";
import { textOf } from "../helpers.js";

const runLiveApiTests = process.env.RUN_LIVE_API_TESTS === "true";
const liveDescribe = runLiveApiTests ? describe : describe.skip;

async function fetchData<T>(endpoint: string): Promise<T> {
  const result = await makeSejmRequest<T>(endpoint);
  if (!result.ok) {
    throw new Error(`Live API setup failed: ${result.error.message}`);
  }
  return result.data;
}

function expectSuccess(result: ToolResponse, prefix: string): void {
  expect(result.isError).toBeUndefined();
  expect(textOf(result)).toContain(prefix);
}

/** Parses the JSON payload that follows the message (and the optional paging summary). */
function payloadOf<T>(result: ToolResponse): T {
  const text = textOf(result);
  return JSON.parse(text.slice(text.search(/[[{][^\n]*$/))) as T;
}

/** IDs discovered from the live API, so the tests do not depend on hardcoded data. */
interface LiveContext {
  term: number;
  sitting: number;
  sittingDate: string;
  votingNumber: number;
  mpId: number;
  clubId: string;
  committeeCode: string;
}

let ctx: LiveContext;

liveDescribe("Sejm API live: every MCP tool", () => {
  jest.setTimeout(60_000);

  beforeAll(async () => {
    const terms = await fetchData<Term[]>("/term");
    const term = (terms.find((t) => t.current) ?? terms[terms.length - 1]).num;

    const today = new Date().toISOString().slice(0, 10);
    const proceedings = await fetchData<Proceeding[]>(`/term${term}/proceedings`);
    const sitting = proceedings
      .filter((p) => p.number > 0 && p.dates.length > 0 && p.dates[0] < today)
      .sort((a, b) => a.number - b.number)[0];

    const votings = await fetchData<VotingDetails[]>(`/term${term}/votings/${sitting.number}`);
    const voting = await fetchData<VotingDetails>(
      `/term${term}/votings/${sitting.number}/${votings[0].votingNumber}`,
    );
    const vote = voting.votes?.[0];
    if (!vote) {
      throw new Error("Live API setup failed: voting has no individual votes");
    }

    const committees = await fetchData<{ code: string }[]>(`/term${term}/committees`);

    ctx = {
      term,
      sitting: sitting.number,
      sittingDate: voting.date.slice(0, 10),
      votingNumber: voting.votingNumber,
      mpId: vote.MP,
      clubId: vote.club,
      committeeCode: committees[0].code,
    };
  });

  it("get-terms", async () => {
    expectSuccess(await tools["get-terms"].handler({}), "Fetched the list of Sejm terms:");
  });

  it("get-members pages the list locally", async () => {
    const result = await tools["get-members"].handler({ term: ctx.term, limit: 2 });

    expectSuccess(result, `Fetched the list of MPs for term ${ctx.term}:`);
    expect(payloadOf<unknown[]>(result)).toHaveLength(2);
  });

  it("get-member", async () => {
    expectSuccess(
      await tools["get-member"].handler({ term: ctx.term, id: ctx.mpId }),
      `Fetched information about the MP with ID ${ctx.mpId}`,
    );
  });

  it("get-member-photo returns an image", async () => {
    const result = await tools["get-member-photo"].handler({ term: ctx.term, id: ctx.mpId, mini: true });

    expect(result.isError).toBeUndefined();
    expect(result.content[1]).toEqual(expect.objectContaining({ type: "image", mimeType: "image/jpeg" }));
  });

  it("get-member-votings", async () => {
    expectSuccess(
      await tools["get-member-votings"].handler({
        term: ctx.term,
        id: ctx.mpId,
        sitting: ctx.sitting,
        date: ctx.sittingDate,
      }),
      `Fetched votes of the MP with ID ${ctx.mpId}`,
    );
  });

  it("get-clubs", async () => {
    expectSuccess(await tools["get-clubs"].handler({ term: ctx.term }), `Fetched the list of clubs for term ${ctx.term}:`);
  });

  it("get-club", async () => {
    expectSuccess(
      await tools["get-club"].handler({ term: ctx.term, id: ctx.clubId }),
      `Fetched details for club ${ctx.clubId}`,
    );
  });

  it("get-committees", async () => {
    expectSuccess(
      await tools["get-committees"].handler({ term: ctx.term, limit: 5 }),
      `Fetched the list of committees for term ${ctx.term}:`,
    );
  });

  it("get-committee", async () => {
    expectSuccess(
      await tools["get-committee"].handler({ term: ctx.term, id: ctx.committeeCode }),
      `Fetched details for committee ${ctx.committeeCode}`,
    );
  });

  it("get-committee reports an unknown code (HTTP 204) as an error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await tools["get-committee"].handler({ term: ctx.term, id: "XYZ" });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("No data found");
  });

  it("get-committee-sittings", async () => {
    expectSuccess(
      await tools["get-committee-sittings"].handler({ term: ctx.term, id: ctx.committeeCode, limit: 5 }),
      `Fetched sittings of committee ${ctx.committeeCode}`,
    );
  });

  it("get-interpellations respects limit and filters", async () => {
    const first = await tools["get-interpellations"].handler({ term: ctx.term, limit: 2 });
    expectSuccess(first, `Fetched the list of interpellations for term ${ctx.term}:`);
    expect(payloadOf<unknown[]>(first)).toHaveLength(2);

    const filtered = await tools["get-interpellations"].handler({ term: ctx.term, from: ctx.mpId, limit: 5 });
    for (const item of payloadOf<{ from: string[] }[]>(filtered)) {
      expect(item.from.map(Number)).toContain(ctx.mpId);
    }
  });

  it("get-interpellation", async () => {
    const list = await tools["get-interpellations"].handler({ term: ctx.term, limit: 1 });
    const [{ num }] = payloadOf<{ num: number }[]>(list);

    expectSuccess(
      await tools["get-interpellation"].handler({ term: ctx.term, id: num }),
      `Fetched details for interpellation ${num}`,
    );
  });

  it("get-written-questions", async () => {
    const result = await tools["get-written-questions"].handler({ term: ctx.term, limit: 2 });

    expectSuccess(result, `Fetched the list of written questions for term ${ctx.term}:`);
    expect(payloadOf<unknown[]>(result)).toHaveLength(2);
  });

  it("get-prints and get-print, including a suffixed print number", async () => {
    const list = await tools["get-prints"].handler({ term: ctx.term, limit: 3 });
    expectSuccess(list, `Fetched the list of prints for term ${ctx.term}:`);
    expect(payloadOf<unknown[]>(list)).toHaveLength(3);

    const all = await fetchData<{ number: string }[]>(`/term${ctx.term}/prints`);
    const suffixed = all.find((p) => p.number.includes("-")) ?? all[0];
    expectSuccess(
      await tools["get-print"].handler({ term: ctx.term, printNumber: suffixed.number }),
      `Fetched details for print ${suffixed.number}`,
    );
  });

  it("get-proceedings", async () => {
    expectSuccess(
      await tools["get-proceedings"].handler({ term: ctx.term }),
      `Fetched the list of proceedings for term ${ctx.term}:`,
    );
  });

  it("get-proceeding", async () => {
    expectSuccess(
      await tools["get-proceeding"].handler({ term: ctx.term, proceeding: ctx.sitting }),
      `Fetched proceeding ${ctx.sitting}`,
    );
  });

  it("get-processes and get-process", async () => {
    const list = await tools["get-processes"].handler({ term: ctx.term, limit: 1 });
    expectSuccess(list, `Fetched the list of processes for term ${ctx.term}:`);

    const [{ number }] = payloadOf<{ number: string }[]>(list);
    expectSuccess(
      await tools["get-process"].handler({ term: ctx.term, processNumber: Number(number) }),
      `Fetched process ${number}`,
    );
  });

  it("get-transcripts and get-transcript-statement", async () => {
    const list = await tools["get-transcripts"].handler({
      term: ctx.term,
      proceeding: ctx.sitting,
      date: ctx.sittingDate,
      limit: 3,
    });
    expectSuccess(list, `Fetched the statements of sitting ${ctx.sitting}`);

    const statements = payloadOf<{ num: number }[]>(list);
    const statementNum = statements[statements.length - 1].num;
    const statement = await tools["get-transcript-statement"].handler({
      term: ctx.term,
      proceeding: ctx.sitting,
      date: ctx.sittingDate,
      statementNum,
    });
    expectSuccess(statement, `Fetched statement ${statementNum}`);
    expect(textOf(statement)).not.toContain("<p>");
  });

  it("get-videos", async () => {
    expectSuccess(
      await tools["get-videos"].handler({ term: ctx.term, limit: 2 }),
      `Fetched the list of video recordings for term ${ctx.term}:`,
    );
  });

  it("get-votings", async () => {
    expectSuccess(
      await tools["get-votings"].handler({ term: ctx.term, proceeding: ctx.sitting, limit: 5 }),
      `Fetched the list of votings for sitting ${ctx.sitting}`,
    );
  });

  it("get-voting filtered by club", async () => {
    const result = await tools["get-voting"].handler({
      term: ctx.term,
      sitting: ctx.sitting,
      votingNumber: ctx.votingNumber,
      club: ctx.clubId,
    });

    expectSuccess(result, `Fetched voting ${ctx.votingNumber}`);
    const { votes } = payloadOf<VotingDetails>(result);
    expect(votes?.length).toBeGreaterThan(0);
    expect(votes?.every((v) => v.club === ctx.clubId)).toBe(true);
  });

  it("search-votings", async () => {
    expectSuccess(
      await tools["search-votings"].handler({ term: ctx.term, proceeding: ctx.sitting, limit: 2 }),
      `Found votings in term ${ctx.term}:`,
    );
  });

  it("get-bilateral-groups", async () => {
    expectSuccess(
      await tools["get-bilateral-groups"].handler({ term: ctx.term, limit: 5 }),
      `Fetched the list of bilateral groups for term ${ctx.term}:`,
    );
  });

  it("covers every registered tool", () => {
    // Keep this list in sync with src/tools/index.ts; a new tool needs a live test above.
    expect(Object.keys(tools).sort()).toEqual(
      [
        "get-terms",
        "get-members",
        "get-member",
        "get-member-photo",
        "get-member-votings",
        "get-clubs",
        "get-club",
        "get-committees",
        "get-committee",
        "get-committee-sittings",
        "get-interpellations",
        "get-interpellation",
        "get-written-questions",
        "get-prints",
        "get-print",
        "get-proceedings",
        "get-proceeding",
        "get-processes",
        "get-process",
        "get-transcripts",
        "get-transcript-statement",
        "get-videos",
        "get-votings",
        "get-voting",
        "search-votings",
        "get-bilateral-groups",
      ].sort(),
    );
  });
});
