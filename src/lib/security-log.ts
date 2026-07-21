import { createClient } from "@/lib/supabase/server";

export type SecurityEventType =
  | "password_changed"
  | "2fa_enabled"
  | "2fa_disabled"
  | "passkey_added"
  | "passkey_removed"
  | "login";

// Best-effort append to the security audit trail. Never throws — a logging
// failure must not break the action that triggered it.
export async function logSecurityEvent(
  userId: string,
  type: SecurityEventType,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.from("activity_logs").insert({ user_id: userId, type: `security.${type}`, data });
  } catch { /* logging is best-effort */ }
}
