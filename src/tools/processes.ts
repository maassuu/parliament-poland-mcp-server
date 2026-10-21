import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { apiPageResponse, errorResponse } from "../utils/response.js";
import type { LegislativeProcess } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, sortBySchema, termSchema } from "./common.js";

export const getProcessesTool = defineTool({
  description: "Get a list of legislative processes for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
    title: z.string().optional().describe("Search for a phrase in the title"),
    documentType: z.string().optional().describe("Only processes of this document type (e.g. 'projekt ustawy')"),
    passed: z.boolean().optional().describe("Only passed acts"),
    modifiedSince: z.string().optional().describe("Only processes modified since this date-time (e.g. '2024-09-07T14:58:28')"),
    sort_by: sortBySchema,
  },
  handler: async ({ term, offset, limit, title, documentType, passed, modifiedSince, sort_by }) => {
    const processes = await makeSejmRequest<LegislativeProcess[]>(
      `/term${term}/processes`,
      { offset, limit, title, documentType, passed, modifiedSince, sort_by },
    );

    if (!processes.ok) {
      return errorResponse(`Failed to fetch the list of processes for term ${term}.`, processes.error);
    }

    return apiPageResponse(`Fetched the list of processes for term ${term}:`, processes.data, { offset, limit });
  },
});
