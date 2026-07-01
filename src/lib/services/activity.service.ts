import { BaseService } from "./base.service";

interface LogInput {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class ActivityService extends BaseService {
  async log(input: LogInput): Promise<void> {
    try {
      const db = await this.getDb();
      await db.from("activity_logs").insert({
        user_id: input.userId,
        action: input.action,
        resource: input.resource,
        resource_id: input.resourceId,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Best effort — never throw on logging failure
    }
  }

  async findMany(userId: string, opts: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = opts;
    const db = await this.getDb();
    const { data } = await db
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    return data ?? [];
  }
}

export const activityService = new ActivityService();
