import { makeSejmRequest } from "../utils/api.js";
import { errorResponse, listResponse } from "../utils/response.js";
import type { BilateralGroup } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

export const getBilateralGroupsTool = defineTool({
  description: "Get a list of bilateral groups in the Sejm",
  schema: {
    term: termSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, offset, limit }) => {
    const groups = await makeSejmRequest<BilateralGroup[]>(`/term${term}/bilateralGroups`);

    if (!groups.ok) {
      return errorResponse(`Failed to fetch the list of bilateral groups for term ${term}.`, groups.error);
    }

    return listResponse(`Fetched the list of bilateral groups for term ${term}:`, groups.data, { offset, limit });
  },
});
