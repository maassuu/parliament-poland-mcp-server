import { makeSejmRequest } from "../utils/api.js";
import { errorResponse, listResponse } from "../utils/response.js";
import type { Term } from "../types/api.js";
import { defineTool, limitSchema, offsetSchema } from "./common.js";

export const getTermsTool = defineTool({
  description: "Get a list of Sejm terms",
  schema: {
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ offset, limit }) => {
    const terms = await makeSejmRequest<Term[]>("/term");

    if (!terms.ok) {
      return errorResponse("Failed to fetch the list of terms.", terms.error);
    }

    return listResponse("Fetched the list of Sejm terms:", terms.data, { offset, limit });
  },
});
