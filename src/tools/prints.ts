import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { dataResponse, errorResponse, listResponse } from "../utils/response.js";
import type { Print } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, segment, sortBySchema, termSchema } from "./common.js";

export const getPrintsTool = defineTool({
  description: "Get a list of prints for a given term",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
    sort_by: sortBySchema,
  },
  handler: async ({ term, offset, limit, sort_by }) => {
    const prints = await makeSejmRequest<Print[]>(`/term${term}/prints`, { sort_by });

    if (!prints.ok) {
      return errorResponse(`Failed to fetch the list of prints for term ${term}.`, prints.error);
    }

    return listResponse(`Fetched the list of prints for term ${term}:`, prints.data, { offset, limit });
  },
});

export const getPrintTool = defineTool({
  description: "Get detailed information about a specific print",
  schema: {
    term: termSchema,
    printNumber: z
      .union([z.number().int().positive(), z.string().regex(/^\d+(-[A-Z]+)?$/)])
      .describe("Number of the print, e.g. 128 or '128-A'"),
  },
  handler: async ({ term, printNumber }) => {
    const print = await makeSejmRequest<Print>(`/term${term}/prints/${segment(printNumber)}`);

    if (!print.ok) {
      return errorResponse(`Failed to fetch details for print ${printNumber} in term ${term}.`, print.error);
    }

    return dataResponse(`Fetched details for print ${printNumber} in term ${term}:`, print.data);
  },
});
