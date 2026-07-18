// ─── Ask history ──────────────────────────────────────────────────────────────
// Every question the user asks a director (Спросить) or the whole board
// (Совет) is saved here so it can be revisited on the История page.
// Stored in localStorage — survives reloads without needing the backend.

export interface CouncilAnswer {
  role: string;
  name: string;
  text: string;
  color: string;
}

export interface AskEntry {
  id: string;
  kind: "agent" | "council";
  question: string;
  date: number;
  // agent ask
  agentSlug?: string;
  agentName?: string;
  agentRole?: string;
  color?: string;
  answer?: string;
  // council session
  responses?: CouncilAnswer[];
  verdict?: string;
}

const KEY = "vertlix-ask-history";
const MAX = 200;

export function loadAsks(): AskEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAsk(entry: AskEntry): void {
  if (typeof window === "undefined") return;
  try {
    const next = [entry, ...loadAsks().filter(a => a.id !== entry.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    // Let any open tab (e.g. the История page) refresh live.
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore quota errors */ }
  // Mirror to the account (best-effort). Falls back silently when signed out
  // or before the ask_history table exists.
  fetch("/api/ask-history", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry),
  }).catch(() => { /* offline / not configured */ });
}

export function deleteAsk(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(loadAsks().filter(a => a.id !== id)));
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore */ }
  fetch(`/api/ask-history/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}

/**
 * Pull the account's history from the server and merge it into the local
 * cache (union by id, newest first). Returns the merged list. Safe to call
 * when signed out or before the table exists — it just returns the local list.
 */
export async function syncFromServer(): Promise<AskEntry[]> {
  const local = loadAsks();
  if (typeof window === "undefined") return local;
  try {
    const res = await fetch("/api/ask-history");
    if (!res.ok) return local;
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return local;
    const byId = new Map<string, AskEntry>();
    for (const e of [...json.data, ...local]) if (e?.id && !byId.has(e.id)) byId.set(e.id, e);
    const merged = [...byId.values()].sort((a, b) => b.date - a.date).slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch { /* ignore */ }
    return merged;
  } catch {
    return local;
  }
}

export function clearAsks(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore */ }
}
