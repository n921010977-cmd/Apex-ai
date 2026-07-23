// Calls `fn` at most once per `intervalMs`, always with the latest value, and
// guarantees a trailing call. Used to edit the streaming Telegram message
// without hitting Telegram's edit rate limit.
export function makeThrottler<T>(intervalMs: number, fn: (v: T) => Promise<void> | void) {
  let last = 0;
  let pending: T | null = null;
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  async function run(v: T) {
    running = true;
    last = Date.now();
    try { await fn(v); } catch { /* ignore transient edit errors */ }
    running = false;
    if (pending !== null) {
      const next = pending; pending = null;
      schedule(next);
    }
  }

  function schedule(v: T) {
    if (running) { pending = v; return; }
    const wait = Math.max(0, intervalMs - (Date.now() - last));
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => run(v), wait);
  }

  return {
    push(v: T) { schedule(v); },
    async flush(v: T) { if (timer) clearTimeout(timer); await run(v); },
  };
}
