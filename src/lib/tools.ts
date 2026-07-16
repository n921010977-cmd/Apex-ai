import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: "Create a task in the project management system",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task priority" },
        due_date: { type: "string", description: "Due date in ISO format (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "search_web",
    description: "Search the web for current information about a topic",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "generate_report",
    description: "Generate a structured business report or document",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Report title" },
        sections: { type: "array", items: { type: "string" }, description: "Section names" },
        format: { type: "string", enum: ["markdown", "json", "text"], description: "Output format" },
      },
      required: ["title"],
    },
  },
  {
    name: "get_project_data",
    description: "Retrieve project data and analytics from the database",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Project ID (optional, returns all if omitted)" },
      },
    },
  },
  {
    name: "calculate_metrics",
    description: "Calculate business metrics like LTV, CAC, ROI, burn rate",
    input_schema: {
      type: "object" as const,
      properties: {
        metric: { type: "string", enum: ["ltv", "cac", "ltv_cac_ratio", "burn_rate", "runway", "mrr", "arr"], description: "Metric to calculate" },
        params: { type: "object", description: "Parameters for the calculation" },
      },
      required: ["metric", "params"],
    },
  },
];

export interface ToolContext {
  organizationId: string;
  userId: string;
  projectId?: string;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "create_task":
      return createTask(input, ctx);
    case "search_web":
      return searchWeb(input.query as string);
    case "generate_report":
      return generateReport(input);
    case "get_project_data":
      return getProjectData(input.project_id as string | undefined, ctx);
    case "calculate_metrics":
      return calculateMetrics(input.metric as string, input.params as Record<string, number>);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function createTask(input: Record<string, unknown>, ctx: ToolContext) {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db.from("tasks").insert({
      organization_id: ctx.organizationId,
      project_id: ctx.projectId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      status: "todo",
      assigned_to: ctx.userId,
      due_date: input.due_date ?? null,
    }).select().single();

    if (error) return { error: error.message };
    return { success: true, task_id: data.id, title: data.title, message: `Task "${data.title}" created successfully` };
  } catch (e) {
    return { error: String(e) };
  }
}

async function searchWeb(query: string) {
  // Brave Search API or fallback to structured response
  try {
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!braveKey) {
      return {
        results: [
          { title: `Search: ${query}`, snippet: `Real-time web search requires BRAVE_SEARCH_API_KEY. Based on training data: this query would return current information about "${query}".`, url: "#" },
        ],
        note: "Configure BRAVE_SEARCH_API_KEY for live search results",
      };
    }
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: { "Accept": "application/json", "X-Subscription-Token": braveKey },
    });
    const data = await res.json();
    return {
      results: (data.web?.results ?? []).slice(0, 5).map((r: { title: string; description: string; url: string }) => ({
        title: r.title, snippet: r.description, url: r.url,
      })),
    };
  } catch (e) {
    return { error: String(e) };
  }
}

function generateReport(input: Record<string, unknown>) {
  const sections = (input.sections as string[]) ?? ["Executive Summary", "Analysis", "Recommendations"];
  return {
    title: input.title,
    format: input.format ?? "markdown",
    sections,
    generated_at: new Date().toISOString(),
    message: `Report template created with ${sections.length} sections. Ready for content generation.`,
  };
}

async function getProjectData(projectId: string | undefined, ctx: ToolContext) {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let query = db.from("projects").select("id, name, description, overall_score, status, created_at, target_revenue, industry, stage").eq("organization_id", ctx.organizationId);
    if (projectId) query = query.eq("id", projectId);
    const { data, error } = await query.limit(10);
    if (error) return { error: error.message };
    return { projects: data, count: data?.length ?? 0 };
  } catch (e) {
    return { error: String(e) };
  }
}

function calculateMetrics(metric: string, params: Record<string, number>) {
  switch (metric) {
    case "ltv":
      return { metric: "LTV", value: (params.arpu ?? 0) * (params.avg_lifetime_months ?? 12), unit: "$", formula: "ARPU × Avg Lifetime" };
    case "cac":
      return { metric: "CAC", value: (params.marketing_spend ?? 0) / (params.new_customers ?? 1), unit: "$", formula: "Marketing Spend / New Customers" };
    case "ltv_cac_ratio":
      return { metric: "LTV/CAC", value: (params.ltv ?? 0) / (params.cac ?? 1), unit: "x", benchmark: "Good: >3x, Excellent: >5x" };
    case "burn_rate":
      return { metric: "Burn Rate", value: (params.monthly_expenses ?? 0) - (params.monthly_revenue ?? 0), unit: "$/month", formula: "Expenses - Revenue" };
    case "runway": {
      const burn = (params.monthly_expenses ?? 0) - (params.monthly_revenue ?? 0);
      return { metric: "Runway", value: burn > 0 ? Math.round((params.cash ?? 0) / burn) : Infinity, unit: "months", warning: burn <= 0 ? "Profitable — no runway concern" : undefined };
    }
    case "mrr":
      return { metric: "MRR", value: (params.subscribers ?? 0) * (params.avg_price ?? 0), unit: "$/month" };
    case "arr":
      return { metric: "ARR", value: (params.subscribers ?? 0) * (params.avg_price ?? 0) * 12, unit: "$/year" };
    default:
      return { error: `Unknown metric: ${metric}` };
  }
}
