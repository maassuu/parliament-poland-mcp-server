import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { apiPageResponse, errorResponse } from "../utils/response.js";
import type { Video } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

export const getVideosTool = defineTool({
  description: "Get a list of video recordings for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
    title: z.string().optional().describe("Search for a phrase in the title"),
    type: z.string().optional().describe("Only videos of this type (e.g. 'komisja', 'posiedzenie')"),
    comm: z.string().optional().describe("Only videos of the committee with this code (e.g. 'SUE')"),
    since: dateSchema.optional().describe("Only videos starting on or after this date (YYYY-MM-DD)"),
    till: dateSchema.optional().describe("Only videos starting before this date (YYYY-MM-DD)"),
  },
  handler: async ({ term, offset, limit, title, type, comm, since, till }) => {
    const videos = await makeSejmRequest<Video[]>(
      `/term${term}/videos`,
      { offset, limit, title, type, comm, since, till },
    );

    if (!videos.ok) {
      return errorResponse(`Failed to fetch the list of video recordings for term ${term}.`, videos.error);
    }

    return apiPageResponse(`Fetched the list of video recordings for term ${term}:`, videos.data, {
      offset,
      limit,
    });
  },
});
