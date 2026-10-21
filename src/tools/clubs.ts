import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { dataResponse, errorResponse, listResponse } from "../utils/response.js";
import type { Club } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, segment, termSchema } from "./common.js";

export const getClubsTool = defineTool({
  description: "Get a list of clubs for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, offset, limit }) => {
    const clubs = await makeSejmRequest<Club[]>(`/term${term}/clubs`);

    if (!clubs.ok) {
      return errorResponse(`Failed to fetch the list of clubs for term ${term}.`, clubs.error);
    }

    return listResponse(`Fetched the list of clubs for term ${term}:`, clubs.data, { offset, limit });
  },
});

export const getClubTool = defineTool({
  description: "Get detailed information about a specific club",
  schema: {
    term: termSchema,
    id: z.string().min(1).describe("ID of the club, case-sensitive (e.g. 'KO', 'PiS'); see get-clubs"),
  },
  handler: async ({ term, id }) => {
    const club = await makeSejmRequest<Club>(`/term${term}/clubs/${segment(id)}`);

    if (!club.ok) {
      return errorResponse(`Failed to fetch details for club ${id} in term ${term}.`, club.error);
    }

    return dataResponse(`Fetched details for club ${id} in term ${term}:`, club.data);
  },
});
