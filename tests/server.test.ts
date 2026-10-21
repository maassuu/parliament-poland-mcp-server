import { jest } from "@jest/globals";
import { toolTitle, tools } from "../src/tools/index.js";
const registerTool = jest.fn();

jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    registerTool,
  })),
}));

describe("server tool registration", () => {
  it("registers every tool under its registry name", async () => {
    await import("../src/server.js");

    expect(registerTool).toHaveBeenCalledTimes(Object.keys(tools).length);

    for (const [name, tool] of Object.entries(tools)) {
      expect(registerTool).toHaveBeenCalledWith(
        name,
        expect.objectContaining({
          title: toolTitle(name),
          description: tool.description,
          inputSchema: tool.schema,
        }),
        expect.any(Function)
      );
    }
  });

  it("uses kebab-case names that are valid MCP tool names", () => {
    for (const name of Object.keys(tools)) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe("toolTitle", () => {
  it("turns a tool name into a readable title", () => {
    expect(toolTitle("get-member-votings")).toBe("Get member votings");
  });
});
