import { z } from "zod";
import { makeSejmRequest, makeSejmTextRequest } from "../utils/api.js";
import { htmlToText } from "../utils/html.js";
import { errorResponse, listResponse, plainTextResponse } from "../utils/response.js";
import type { TranscriptDay } from "../types/api.js";
import { dateSchema, defineTool, limitSchema, offsetSchema, termSchema } from "./common.js";

const proceedingSchema = z.number().int().positive().describe("Sejm sitting number");
const sittingDateSchema = dateSchema.describe("Sitting day in YYYY-MM-DD format (see get-proceedings)");

export const getTranscriptsTool = defineTool({
  description: "Get the list of statements (speakers) in the transcript of one sitting day",
  schema: {
    term: termSchema,
    proceeding: proceedingSchema,
    date: sittingDateSchema,
    offset: offsetSchema,
    limit: limitSchema,
  },
  handler: async ({ term, proceeding, date, offset, limit }) => {
    const transcript = await makeSejmRequest<TranscriptDay>(
      `/term${term}/proceedings/${proceeding}/${date}/transcripts`,
    );

    if (!transcript.ok) {
      return errorResponse(
        `Failed to fetch the transcript of sitting ${proceeding} (${date}) in term ${term}.`,
        transcript.error,
      );
    }

    return listResponse(
      `Fetched the statements of sitting ${proceeding} (${date}) in term ${term}:`,
      transcript.data.statements ?? [],
      { offset, limit },
    );
  },
});

export const getTranscriptStatementTool = defineTool({
  description: "Get the full text of a single statement from a sitting transcript",
  schema: {
    term: termSchema,
    proceeding: proceedingSchema,
    date: sittingDateSchema,
    statementNum: z.number().int().nonnegative().describe("Statement number (see get-transcripts)"),
  },
  handler: async ({ term, proceeding, date, statementNum }) => {
    const statement = await makeSejmTextRequest(
      `/term${term}/proceedings/${proceeding}/${date}/transcripts/${statementNum}`,
    );

    if (!statement.ok) {
      return errorResponse(
        `Failed to fetch statement ${statementNum} of sitting ${proceeding} (${date}) in term ${term}.`,
        statement.error,
      );
    }

    return plainTextResponse(
      `Fetched statement ${statementNum} of sitting ${proceeding} (${date}) in term ${term}:`,
      htmlToText(statement.data),
    );
  },
});
