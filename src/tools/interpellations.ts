import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { apiPageResponse, dataResponse, errorResponse } from "../utils/response.js";
import type { Interpellation } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, sortBySchema, termSchema } from "./common.js";

export const getInterpellationsTool = defineTool({
  description: "Get a list of interpellations for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
    from: z.number().int().positive().optional().describe("Only interpellations submitted by the MP with this ID"),
    to: z.string().optional().describe("Only interpellations sent to this recipient (e.g. 'minister finansów')"),
    title: z.string().optional().describe("Search for a phrase in the title"),
    since: dateSchema.optional().describe("Only interpellations sent on or after this date (YYYY-MM-DD)"),
    till: dateSchema.optional().describe("Only interpellations sent before this date (YYYY-MM-DD)"),
    delayed: z.boolean().optional().describe("Only interpellations whose answer is delayed"),
    modifiedSince: z.string().optional().describe("Only interpellations modified since this date-time (e.g. '2024-09-07T14:58:28')"),
    sort_by: sortBySchema,
  },
  handler: async ({ term, offset, limit, from, to, title, since, till, delayed, modifiedSince, sort_by }) => {
    const interpellations = await makeSejmRequest<Interpellation[]>(
      `/term${term}/interpellations`,
      { offset, limit, from, to, title, since, till, delayed, modifiedSince, sort_by },
    );

    if (!interpellations.ok) {
      return errorResponse(`Failed to fetch the list of interpellations for term ${term}.`, interpellations.error);
    }

    return apiPageResponse(`Fetched the list of interpellations for term ${term}:`, interpellations.data, {
      offset,
      limit,
    });
  },
});

export const getInterpellationTool = defineTool({
  description: "Get detailed information about a specific interpellation",
  schema: {
    term: termSchema,
    id: z.number().int().positive().describe("Number of the interpellation"),
  },
  handler: async ({ term, id }) => {
    const interpellation = await makeSejmRequest<Interpellation>(`/term${term}/interpellations/${id}`);

    if (!interpellation.ok) {
      return errorResponse(
        `Failed to fetch details for interpellation ${id} in term ${term}.`,
        interpellation.error,
      );
    }

    return dataResponse(`Fetched details for interpellation ${id} in term ${term}:`, interpellation.data);
  },
});
