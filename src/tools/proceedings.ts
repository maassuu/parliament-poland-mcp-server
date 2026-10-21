import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { htmlToText } from "../utils/html.js";
import { dataResponse, errorResponse, listResponse } from "../utils/response.js";
import type { Proceeding } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

export const getProceedingsTool = defineTool({
  description: "Get a list of proceedings (sittings) for a given term, without agendas",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, offset, limit }) => {
    const proceedings = await makeSejmRequest<Proceeding[]>(`/term${term}/proceedings`);

    if (!proceedings.ok) {
      return errorResponse(`Failed to fetch the list of proceedings for term ${term}.`, proceedings.error);
    }

    // Agendas are long HTML documents; get-proceeding returns one as plain text.
    const summaries = proceedings.data.map(({ agenda: _agenda, ...rest }) => rest);
    return listResponse(`Fetched the list of proceedings for term ${term}:`, summaries, { offset, limit });
  },
});

export const getProceedingTool = defineTool({
  description: "Get details of a specific proceeding (sitting), including its agenda as plain text",
  schema: {
    term: termSchema,
    proceeding: z.number().int().positive().describe("Sejm sitting number"),
  },
  handler: async ({ term, proceeding }) => {
    const result = await makeSejmRequest<Proceeding>(`/term${term}/proceedings/${proceeding}`);

    if (!result.ok) {
      return errorResponse(`Failed to fetch proceeding ${proceeding} for term ${term}.`, result.error);
    }

    const data = result.data.agenda ? { ...result.data, agenda: htmlToText(result.data.agenda) } : result.data;
    return dataResponse(`Fetched proceeding ${proceeding} for term ${term}:`, data);
  },
});
