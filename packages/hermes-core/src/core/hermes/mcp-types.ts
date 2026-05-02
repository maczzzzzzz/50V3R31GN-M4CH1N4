/**
 * src/core/hermes/mcp-types.ts
 * 
 * Model Context Protocol (MCP) common types.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}
