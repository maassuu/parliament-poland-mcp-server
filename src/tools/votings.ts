import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { apiPageResponse, dataResponse, errorResponse, listResponse } from "../utils/response.js";
import type { Voting, VotingDetails } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

const sittingSchema = z.number().int().positive().describe("Sejm sitting number");

export const getVotingsTool = defineTool({
  description: "Get a list of votings for a given sitting",
  schema: {
    term: termSchema,
    proceeding: sittingSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, proceeding, offset, limit }) => {
    const votings = await makeSejmRequest<Voting[]>(`/term${term}/votings/${proceeding}`);

    if (!votings.ok) {
      return errorResponse(`Failed to fetch the list of votings for sitting ${proceeding} in term ${term}.`, votings.error);
    }

    return listResponse(`Fetched the list of votings for sitting ${proceeding} in term ${term}:`, votings.data, {
      offset,
      limit,
    });
  },
});

export const getVotingTool = defineTool({
  description: "Get details of a single voting, including how each MP voted",
  schema: {
    term: termSchema,
    sitting: sittingSchema,
    votingNumber: z.number().int().positive().describe("Number of the voting within the sitting"),
    club: z.string().optional().describe("Only include votes of MPs from this club (e.g. 'KO', 'PiS')"),
  },
  handler: async ({ term, sitting, votingNumber, club }) => {
    const voting = await makeSejmRequest<VotingDetails>(`/term${term}/votings/${sitting}/${votingNumber}`);

    if (!voting.ok) {
      return errorResponse(
        `Failed to fetch voting ${votingNumber} of sitting ${sitting} in term ${term}.`,
        voting.error,
      );
    }

    const data = club && voting.data.votes
      ? { ...voting.data, votes: voting.data.votes.filter((vote) => vote.club === club) }
      : voting.data;
    return dataResponse(`Fetched voting ${votingNumber} of sitting ${sitting} in term ${term}:`, data);
  },
});

export const searchVotingsTool = defineTool({
  description: "Search votings in a given term by title, date range or sitting",
  schema: {
    term: termSchema,
    title: z.string().optional().describe("Search for a phrase in the voting title"),
    dateFrom: dateSchema.optional().describe("Only votings on or after this date (YYYY-MM-DD)"),
    dateTo: dateSchema.optional().describe("Only votings before this date (YYYY-MM-DD)"),
    proceeding: sittingSchema.optional().describe("Only votings from this sitting number"),
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, title, dateFrom, dateTo, proceeding, offset, limit }) => {
    const votings = await makeSejmRequest<Voting[]>(
      `/term${term}/votings/search`,
      { title, dateFrom, dateTo, proceeding, offset, limit },
    );

    if (!votings.ok) {
      return errorResponse(`Failed to search votings in term ${term}.`, votings.error);
    }

    return apiPageResponse(`Found votings in term ${term}:`, votings.data, { offset, limit });
  },
});
