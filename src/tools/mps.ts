import { z } from "zod";
import { makeSejmImageRequest, makeSejmRequest } from "../utils/api.js";
import { dataResponse, errorResponse, imageResponse, listResponse } from "../utils/response.js";
import type { Mp, MpVoting } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

const mpIdSchema = z.number().int().positive().describe("ID of the MP");

export const getMpTool = defineTool({
  description: "Get information about a member of Parliament",
  schema: {
    term: termSchema,
    id: mpIdSchema,
  },
  handler: async ({ term, id }) => {
    const mp = await makeSejmRequest<Mp>(`/term${term}/MP/${id}`);

    if (!mp.ok) {
      return errorResponse(
        `Failed to fetch information about the MP with ID ${id} in term ${term}.`,
        mp.error,
      );
    }

    return dataResponse(`Fetched information about the MP with ID ${id} in term ${term}:`, mp.data);
  },
});

export const getMpsTool = defineTool({
  description: "Get a list of MPs for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, offset, limit }) => {
    const mps = await makeSejmRequest<Mp[]>(`/term${term}/MP`);

    if (!mps.ok) {
      return errorResponse(`Failed to fetch the list of MPs for term ${term}.`, mps.error);
    }

    return listResponse(`Fetched the list of MPs for term ${term}:`, mps.data, { offset, limit });
  },
});

export const getMpPhotoTool = defineTool({
  description: "Get the official photo of a member of Parliament",
  schema: {
    term: termSchema,
    id: mpIdSchema,
    mini: z.boolean().optional().describe("Return a small thumbnail instead of the full photo"),
  },
  handler: async ({ term, id, mini }) => {
    const photo = await makeSejmImageRequest(`/term${term}/MP/${id}/${mini ? "photo-mini" : "photo"}`);

    if (!photo.ok) {
      return errorResponse(`Failed to fetch the photo of the MP with ID ${id} in term ${term}.`, photo.error);
    }

    return imageResponse(`Photo of the MP with ID ${id} in term ${term}:`, photo.data);
  },
});

export const getMpVotingsTool = defineTool({
  description: "Get how a member of Parliament voted in all votings on a given sitting day",
  schema: {
    term: termSchema,
    id: mpIdSchema,
    sitting: z.number().int().positive().describe("Sejm sitting number"),
    date: dateSchema.describe("Sitting day in YYYY-MM-DD format"),
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, id, sitting, date, offset, limit }) => {
    const votings = await makeSejmRequest<MpVoting[]>(`/term${term}/MP/${id}/votings/${sitting}/${date}`);

    if (!votings.ok) {
      return errorResponse(
        `Failed to fetch votes of the MP with ID ${id} on sitting ${sitting} (${date}) in term ${term}.`,
        votings.error,
      );
    }

    return listResponse(
      `Fetched votes of the MP with ID ${id} on sitting ${sitting} (${date}) in term ${term}:`,
      votings.data,
      { offset, limit },
    );
  },
});
