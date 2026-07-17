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
    const next = [entry, ...loadAsks()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    // Let any open tab (e.g. the История page) refresh live.
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore quota errors */ }
}

export function deleteAsk(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(loadAsks().filter(a => a.id !== id)));
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore */ }
}

export function clearAsks(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("vertlix-ask-saved"));
  } catch { /* ignore */ }
}
