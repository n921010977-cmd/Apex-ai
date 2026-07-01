import { BaseService } from "./base.service";
import type { CreateProjectSchema, UpdateProjectSchema } from "@/lib/validators";
import type { z } from "zod";

type CreateInput = z.infer<typeof CreateProjectSchema>;
type UpdateInput = z.infer<typeof UpdateProjectSchema>;

export class ProjectService extends BaseService {
  async findMany(userId: string, opts: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 20, search } = opts;
    const db = await this.getDb();

    let query = db.from("projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query.range((page - 1) * limit, page * limit - 1);
    if (error) this.handleError(error, "ProjectService.findMany");

    const { count } = await db.from("projects").select("id", { count: "exact" }).eq("user_id", userId);
    return { items: data ?? [], total: count ?? 0, page, limit, hasMore: page * limit < (count ?? 0) };
  }

  async findById(id: string, userId: string) {
    const db = await this.getDb();
    const { data, error } = await db.from("projects").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) this.handleError(error, "ProjectService.findById");
    return data;
  }

  async create(userId: string, orgId: string | undefined, input: CreateInput) {
    const db = await this.getDb();
    const { data, error } = await db.from("projects").insert({
      user_id: userId,
      organization_id: orgId,
      name: input.name,
      description: input.description,
      industry: input.industry,
      stage: input.stage,
      goals: input.goals,
      timeframe: input.timeframe,
      status: "ACTIVE",
    }).select().single();
    if (error) this.handleError(error, "ProjectService.create");
    return data;
  }

  async update(id: string, userId: string, input: UpdateInput) {
    const db = await this.getDb();
    const { data, error } = await db.from("projects")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", userId)
      .select().single();
    if (error) this.handleError(error, "ProjectService.update");
    return data;
  }

  async delete(id: string, userId: string) {
    const db = await this.getDb();
    const { error } = await db.from("projects").delete().eq("id", id).eq("user_id", userId);
    if (error) this.handleError(error, "ProjectService.delete");
    return true;
  }

  async getStats(userId: string) {
    const db = await this.getDb();
    const { data } = await db.from("projects").select("status").eq("user_id", userId);
    const items = data ?? [];
    return {
      total: items.length,
      active: items.filter((p: { status: string }) => p.status === "ACTIVE").length,
      completed: items.filter((p: { status: string }) => p.status === "COMPLETED").length,
      archived: items.filter((p: { status: string }) => p.status === "ARCHIVED").length,
    };
  }
}

export const projectService = new ProjectService();
