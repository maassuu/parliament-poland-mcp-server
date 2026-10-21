# CLAUDE.md

## Project

Parliament Poland MCP Server - TypeScript MCP server exposing the Polish Parliament public API (api.sejm.gov.pl) as tools for LLMs.

## Stack

- TypeScript (ESM, strict mode)
- @modelcontextprotocol/sdk (MCP server framework)
- Zod (input schema validation)
- esbuild (bundler → build/index.mjs)
- Jest + ts-jest (testing)
- Node 18+

## Commands

- `npm run lint` - Biome linter (formatter disabled)
- `npm run typecheck` - `tsc --noEmit`
- `npm test` - run unit tests
- `npm run test:live-api` - run integration tests against live Sejm API (requires internet)
- `npm run build` - lint, typecheck, run tests, then bundle with esbuild
- `npm start` - run the built server

## Architecture

- `src/index.ts` - entry point, stdio transport
- `src/server.ts` - registers all tools with McpServer
- `src/utils/api.ts` - HTTP client (`makeSejmRequest` for JSON, `makeSejmTextRequest` for HTML, `makeSejmImageRequest` for photos); HTTP 204 is reported as "no data found"
- `src/utils/response.ts` - builds MCP responses: `errorResponse`, `dataResponse`, `listResponse` (pages a full list locally), `apiPageResponse` (page already cut by the API), size cap `MAX_RESPONSE_CHARS`
- `src/utils/html.ts` - `htmlToText` for statements and agendas
- `src/tools/common.ts` - shared zod schemas (`termSchema`, `offsetSchema`, `limitSchema`, `dateSchema`, `sortBySchema`), `segment()` for encoding path parts, `defineTool()` which types the handler from its schema
- `src/tools/*.ts` - each file exports tool objects created with `defineTool({ description, schema, handler })`
- `src/tools/index.ts` - aggregates all tools into a single map keyed by MCP tool name

Tool pattern: handler calls `makeSejmRequest` and returns one of the `src/utils/response.ts` helpers.
Check the endpoint against the API spec (https://api.sejm.gov.pl/sejm/openapi/) before adding a tool: many list endpoints ignore `offset`/`limit` (use `listResponse`), and `sort_by` works while `sort` is ignored.

## Testing

- Unit tests mock `makeSejmRequest` via `jest.mock`
- Integration tests (`tests/integration/`) call the real API - gated by `RUN_LIVE_API_TESTS=true`
- Each tool has its own test file in `tests/tools/`; shared helpers live in `tests/helpers.ts`
- Every tool must also have a live test in `tests/integration/sejmApi.live.test.ts` (a test there checks the list of tools)

## Build

esbuild bundles the source into a single `build/index.mjs` with `#!/usr/bin/env node` banner. `@modelcontextprotocol/sdk` and `zod` are external (installed as dependencies at runtime via npx).

## Conventions

- Tool names use kebab-case in the registry (`get-members`, `get-club`) and are registered with MCP under that name; the title is derived from it (`Get members`)
- Handlers return text content (compact JSON after a description line); `get-member-photo` also returns image content

@TODO.md
