import { z } from "zod";
import { DEFAULT_PAGE_SIZE, type ToolResponse } from "../utils/response.js";

export const termSchema = z.number().int().positive().describe("Term of the Sejm (e.g. 10)");

export const offsetSchema = z
  .number()
  .int()
  .nonnegative()
  .optional()
  .describe("Number of items to skip (default 0)");

export const limitSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe(`Maximum number of items to return (default ${DEFAULT_PAGE_SIZE})`);

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format");

export const sortBySchema = z
  .string()
  .optional()
  .describe("Field to sort by; prefix with '-' for descending order (e.g. '-lastModified')");

/** Encodes a single path segment taken from user input. */
export function segment(value: string | number): string {
  return encodeURIComponent(String(value));
}

/** Keeps the handler's argument type tied to its zod schema. */
export function defineTool<S extends z.ZodRawShape>(tool: {
  description: string;
  schema: S;
  handler: (args: z.infer<z.ZodObject<S>>) => Promise<ToolResponse>;
}) {
  return tool;
}
