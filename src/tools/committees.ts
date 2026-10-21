import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { dataResponse, errorResponse, listResponse } from "../utils/response.js";
import type { Committee, CommitteeSitting } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, segment, termSchema } from "./common.js";

const committeeCodeSchema = z
  .string()
  .min(1)
  .describe("Code of the committee (e.g. 'ASW', 'SUE'); see get-committees");

export const getCommitteesTool = defineTool({
  description: "Get a list of committees for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, offset, limit }) => {
    const committees = await makeSejmRequest<Committee[]>(`/term${term}/committees`);

    if (!committees.ok) {
      return errorResponse(`Failed to fetch the list of committees for term ${term}.`, committees.error);
    }

    return listResponse(`Fetched the list of committees for term ${term}:`, committees.data, {
      offset,
      limit,
    });
  },
});

export const getCommitteeTool = defineTool({
  description: "Get detailed information about a specific committee",
  schema: {
    term: termSchema,
    id: committeeCodeSchema,
  },
  handler: async ({ term, id }) => {
    const committee = await makeSejmRequest<Committee>(`/term${term}/committees/${segment(id)}`);

    if (!committee.ok) {
      return errorResponse(`Failed to fetch details for committee ${id} in term ${term}.`, committee.error);
    }

    return dataResponse(`Fetched details for committee ${id} in term ${term}:`, committee.data);
  },
});

export const getCommitteeSittingsTool = defineTool({
  description: "Get a list of sittings of a specific committee",
  schema: {
    term: termSchema,
    id: committeeCodeSchema,
    cancelled: z.boolean().optional().describe("Also include cancelled sittings"),
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, id, cancelled, offset, limit }) => {
    const sittings = await makeSejmRequest<CommitteeSitting[]>(
      `/term${term}/committees/${segment(id)}/sittings`,
      { cancelled },
    );

    if (!sittings.ok) {
      return errorResponse(
        `Failed to fetch sittings of committee ${id} in term ${term}.`,
        sittings.error,
      );
    }

    return listResponse(`Fetched sittings of committee ${id} in term ${term}:`, sittings.data, {
      offset,
      limit,
    });
  },
});
