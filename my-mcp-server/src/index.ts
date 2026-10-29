
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the MCP server.
const server = new McpServer({
  name: "project-assistant",
  version: "1.0.0",
});

// Register a tool.
server.registerTool(
  "add_numbers",
  {
    description: "Add two numbers together",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: String(a + b),
        },
      ],
    };
  },
);

// Mock database.
const projects: Record<string, {
  name: string;
  status: string;
  budget: number;
}> = {
  alpha: {
    name: "Project Alpha",
    status: "active",
    budget: 80000,
  },
  beta: {
    name: "Project Beta",
    status: "completed",
    budget: 45000,
  },
};

// Register another tool.
server.registerTool(
  "get_project",
  {
    description: "Get a project by its ID",
    inputSchema: {
      projectId: z.string(),
    },
  },
  async ({ projectId }) => {
    const project = projects[projectId];

    if (!project) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Project not found",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(project),
        },
      ],
    };
  },
);

server.registerResource(
  "project-policy",
  "policy://projects",
  {
    description: "Project management policy",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/plain",
        text: [
          "Projects must have an assigned owner.",
          "Budgets require approval before work begins.",
          "Completed projects must be archived.",
        ].join("\n"),
      },
    ],
  }),
);
// Connect using standard input/output.
const transport = new StdioServerTransport();

await server.connect(transport);