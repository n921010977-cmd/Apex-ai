// ─── Action items / tasks ─────────────────────────────────────────────────────
// Turns AI advice into trackable to-dos. localStorage-backed (like ask-history)
// so it works offline and without the backend; a "vertlix-tasks-changed" event
// lets open tabs refresh live.

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  source?: string;      // e.g. "Совет директоров", "Marcus Chen · CFO", "Вручную"
  color?: string;
  createdAt: number;
  doneAt?: number;
}

const KEY = "vertlix-tasks";
const MAX = 300;

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(next: Task[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("vertlix-tasks-changed"));
  } catch { /* ignore quota */ }
}

export function addTask(input: { title: string; priority?: Priority; source?: string; color?: string }): Task | null {
  const title = input.title.trim();
  if (!title) return null;
  const task: Task = {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    done: false,
    priority: input.priority ?? "medium",
    source: input.source ?? "Вручную",
    color: input.color,
    createdAt: Date.now(),
  };
  write([task, ...loadTasks()]);
  return task;
}

export function toggleTask(id: string) {
  write(loadTasks().map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : undefined } : t));
}

export function updateTask(id: string, patch: Partial<Pick<Task, "title" | "priority">>) {
  write(loadTasks().map(t => t.id === id ? { ...t, ...patch } : t));
}

export function deleteTask(id: string) {
  write(loadTasks().filter(t => t.id !== id));
}

export function clearDone() {
  write(loadTasks().filter(t => !t.done));
}
