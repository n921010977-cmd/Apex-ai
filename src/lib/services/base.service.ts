import { createClient } from "@/lib/supabase/server";

export class BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getDb(): Promise<any> {
    const supabase = await createClient();
    return supabase as any;
  }

  protected handleError(error: unknown, context: string): never {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] ${msg}`);
    throw new Error(`${context}: ${msg}`);
  }

  protected paginate<T>(items: T[], page: number, limit: number) {
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    return { items: paged, total: items.length, page, limit, hasMore: start + limit < items.length };
  }
}
