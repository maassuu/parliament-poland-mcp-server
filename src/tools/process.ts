import { z } from "zod";
import { makeSejmRequest } from "../utils/api.js";
import { dataResponse, errorResponse } from "../utils/response.js";
import type { LegislativeProcess } from "../types/api.js";
import { defineTool, termSchema } from "./common.js";

export const getProcessTool = defineTool({
  description: "Get information about a specific legislative process",
  schema: {
    term: termSchema,
    processNumber: z.number().int().positive().describe("Number of the legislative process"),
  },
  handler: async ({ term, processNumber }) => {
    const process = await makeSejmRequest<LegislativeProcess>(`/term${term}/processes/${processNumber}`);

    if (!process.ok) {
      return errorResponse(`Failed to fetch process ${processNumber} for term ${term}.`, process.error);
    }

    return dataResponse(`Fetched process ${processNumber} for term ${term}:`, process.data);
  },
});
