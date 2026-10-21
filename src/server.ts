import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolTitle, tools } from "./tools/index.js";

export const server = new McpServer({
  name: "Parliament Poland MCP Server",
  version: "1.3.5",
});

for (const [name, tool] of Object.entries(tools)) {
  server.registerTool(
    name,
    {
      title: toolTitle(name),
      description: tool.description,
      inputSchema: tool.schema,
    },
    // Each handler is typed by its own schema; the SDK validates the input before calling it.
    (params: Record<string, unknown>) => tool.handler(params as never),
  );
}
