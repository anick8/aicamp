
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type OpenAI from "openai";

const projectStatus = z.enum([
  "planned",
  "active",
  "completed",
]);

const listProjectsSchema = z.strictObject({
  status: projectStatus.nullable(),
});

const projectDetailsSchema = z.strictObject({
  project_id: z.uuid(),
});

const percentageSchema = z.strictObject({
  amount: z.number().finite(),
  percentage: z.number().finite(),
});

export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_projects",
      description:
        "List the signed-in user's projects. " +
        "Optionally filter by project status.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          status: {
            type: ["string", "null"],
            enum: ["planned", "active", "completed", null],
          },
        },
        required: ["status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_details",
      description: "Get details of one project by UUID.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "The UUID of the project.",
          },
        },
        required: ["project_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_percentage",
      description: "Calculate a percentage of an amount.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          percentage: { type: "number" },
        },
        required: ["amount", "percentage"],
        additionalProperties: false,
      },
    },
  },
];

export async function executeTool(
  name: string,
  rawArguments: string,
  supabase: SupabaseClient,
): Promise<unknown> {
  let input: unknown;

  try {
    input = JSON.parse(rawArguments);
  } catch {
    return { error: "Invalid JSON arguments" };
  }

  switch (name) {
    case "list_projects": {
      const parsed = listProjectsSchema.safeParse(input);

      if (!parsed.success) {
        return { error: "Invalid list_projects arguments" };
      }

      let query = supabase
        .from("projects")
        .select("id, name, description, status, budget")
        .order("created_at", { ascending: false })
        .limit(50);

      if (parsed.data.status !== null) {
        query = query.eq("status", parsed.data.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error("Project lookup failed");
      }

      return { projects: data };
    }

    case "get_project_details": {
      const parsed = projectDetailsSchema.safeParse(input);

      if (!parsed.success) {
        return { error: "Invalid project UUID" };
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status, budget")
        .eq("id", parsed.data.project_id)
        .maybeSingle();

      if (error) {
        throw new Error("Project lookup failed");
      }

      return { project: data };
    }

    case "calculate_percentage": {
      const parsed = percentageSchema.safeParse(input);

      if (!parsed.success) {
        return { error: "Invalid calculation arguments" };
      }

      const { amount, percentage } = parsed.data;

      const result = (amount * percentage) / 100;

      if (!Number.isFinite(result)) {
        return { error: "Calculation overflow" };
      }

      return { result };
    }

    default:
      return { error: "Tool not allowed" };
  }
}
