import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { apiPageResponse, errorResponse } from "../utils/response.js";
import type { WrittenQuestion } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, sortBySchema, termSchema } from "./common.js";

export const getWrittenQuestionsTool = defineTool({
  description: "Get a list of written questions for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
    sort_by: sortBySchema,
    title: z.string().optional().describe("Search for a phrase in the title"),
    from: z.number().int().positive().optional().describe("Only questions submitted by the MP with this ID"),
    to: z.string().optional().describe("Only questions sent to this recipient (e.g. 'minister finansów')"),
    since: dateSchema.optional().describe("Only questions sent on or after this date (YYYY-MM-DD)"),
    till: dateSchema.optional().describe("Only questions sent before this date (YYYY-MM-DD)"),
    delayed: z.boolean().optional().describe("Only questions whose answer is delayed"),
    modifiedSince: z.string().optional().describe("Only questions modified since this date-time (e.g. '2024-09-07T14:58:28')"),
  },
  handler: async ({ term, offset, limit, sort_by, title, from, to, since, till, delayed, modifiedSince }) => {
    const writtenQuestions = await makeSejmRequest<WrittenQuestion[]>(
      `/term${term}/writtenQuestions`,
      { offset, limit, sort_by, title, from, to, since, till, delayed, modifiedSince },
    );

    if (!writtenQuestions.ok) {
      return errorResponse(`Failed to fetch the list of written questions for term ${term}.`, writtenQuestions.error);
    }

    return apiPageResponse(`Fetched the list of written questions for term ${term}:`, writtenQuestions.data, {
      offset,
      limit,
    });
  },
});
