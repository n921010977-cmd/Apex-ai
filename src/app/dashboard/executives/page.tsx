"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { streamChat } from "@/lib/stream-chat";
import { motion, AnimatePresence } from "framer-motion";

// ─── Agents ───────────────────────────────────────────────────────────────────
type Node = { id: string; ab: string; name: string; role: string; dept: string; score: number; c: string; g: [string, string] };

const CEO: Node = { id: "ceo", ab: "CEO", name: "Sophia Rivers", role: "Стратегическое лидерство", dept: "leadership", score: 96, c: "#818cf8", g: ["#6366f1", "#4f46e5"] };

const CHIEFS: Node[] = [
  { id: "cfo", ab: "CFO", name: "Marcus Chen",    role: "Финансовая стратегия",       dept: "finance",    score: 93, c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { id: "cmo", ab: "CMO", name: "Elena Torres",  role: "Рост и маркетинг",           dept: "marketing",  score: 94, c: "#34d399", g: ["#10b981", "#059669"] },
  { id: "coo", ab: "COO", name: "James Wright",   role: "Операционное превосходство", dept: "operations", score: 92, c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { id: "cto", ab: "CTO", name: "Aiden Park", role: "Технологии и инновации",     dept: "tech",       score: 95, c: "#c084fc", g: ["#a855f7", "#9333ea"] },
];

const SPECIALISTS: Node[] = [
  { id: "fp", ab: "FP", name: "Kim Park", role: "Планирование и бюджет",    dept: "finance",    score: 91, c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { id: "ra", ab: "RA", name: "Omar Hassan",      role: "Управление рисками",       dept: "finance",    score: 90, c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { id: "ia", ab: "IA", name: "Tom Evans",    role: "Инвест-оценка",            dept: "finance",    score: 92, c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { id: "bs", ab: "BS", name: "Chloe Martin",  role: "Бренд и позиционирование", dept: "marketing",  score: 92, c: "#34d399", g: ["#10b981", "#059669"] },
  { id: "gh", ab: "GH", name: "Alex Kim",     role: "Growth-маркетинг",         dept: "marketing",  score: 91, c: "#34d399", g: ["#10b981", "#059669"] },
  { id: "mr", ab: "MR", name: "Nina Brown", role: "Рыночная разведка",        dept: "marketing",  score: 91, c: "#34d399", g: ["#10b981", "#059669"] },
  { id: "po", ab: "PO", name: "Jake Turner", role: "Оптимизация процессов",    dept: "operations", score: 90, c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { id: "hr", ab: "HR", name: "Maya Scott",        role: "Персонал и культура",      dept: "operations", score: 87, c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { id: "la", ab: "LA", name: "Mia Larson",     role: "Право и комплаенс",        dept: "operations", score: 88, c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { id: "ar", ab: "AR", name: "Leo Zhang",     role: "AI и инновации",           dept: "tech",       score: 93, c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  { id: "da", ab: "DA", name: "Zoe Carter",    role: "Данные и аналитика",       dept: "tech",       score: 92, c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  { id: "pm", ab: "PM", name: "Sara Patel",   role: "Продуктовая стратегия",    dept: "tech",       score: 93, c: "#c084fc", g: ["#a855f7", "#9333ea"] },
];

const ALL: Node[] = [CEO, ...CHIEFS, ...SPECIALISTS];
const byId = Object.fromEntries(ALL.map(n => [n.id, n])) as Record<string, Node>;

// ─── Intelligence script: события, которые «проживает» совет ─────────────────
type Ev = { from: string; to: string; action: string; thought: string; kind: "signal" | "debate" | "decision" };

const SCRIPT: Ev[] = [
  { from: "mr",  to: "cmo", action: "Передал анализ рынка",          thought: "Спрос в сегменте B2B вырос на 18% — окно для экспансии",           kind: "signal" },
  { from: "cmo", to: "ceo", action: "Предложил ускорить экспансию",  thought: "Предлагаю удвоить бюджет каналов, CAC сейчас минимальный",          kind: "debate" },
  { from: "cfo", to: "ceo", action: "Возразил по бюджету",           thought: "Против: runway сократится до 11 месяцев. Нужен поэтапный план",     kind: "debate" },
  { from: "ra",  to: "cfo", action: "Оценил риск сценария",          thought: "Риск умеренный: при поэтапном входе просадка кэша ограничена 8%",   kind: "signal" },
  { from: "cto", to: "ceo", action: "Подтвердил готовность платформы", thought: "Инфраструктура выдержит ×3 нагрузку без доп. затрат",             kind: "debate" },
  { from: "gh",  to: "cmo", action: "Запустил эксперимент",          thought: "A/B на онбординге: конверсия +2.4 п.п., раскатываю на 100%",        kind: "signal" },
  { from: "ceo", to: "cfo", action: "Принял решение",                thought: "Решение: экспансия в 2 этапа. CFO — контроль burn, CMO — каналы",   kind: "decision" },
  { from: "po",  to: "coo", action: "Оптимизировал процесс",         thought: "Цикл обработки заявок сокращён с 46 до 31 часа",                    kind: "signal" },
  { from: "da",  to: "cto", action: "Обновил витрину данных",        thought: "Метрики удержания теперь считаются в реальном времени",             kind: "signal" },
  { from: "ia",  to: "cfo", action: "Пересчитал юнит-экономику",     thought: "LTV/CAC = 4.1 — подтверждаю целесообразность инвестиций в рост",    kind: "signal" },
  { from: "bs",  to: "cmo", action: "Предложил новое позиционирование", thought: "Смещаем фокус с 'AI-инструмент' на 'AI-команда' — резонирует сильнее", kind: "debate" },
  { from: "hr",  to: "coo", action: "Отчитался по найму",            thought: "Закрыты 2 ключевые позиции, скорость найма +30%",                   kind: "signal" },
  { from: "pm",  to: "ceo", action: "Защитил роадмап Q3",            thought: "Приоритет: API-интеграции. 62% запросов клиентов — про них",        kind: "debate" },
  { from: "la",  to: "coo", action: "Проверил комплаенс",            thought: "Новые рынки: юридических блокеров для запуска нет",                 kind: "signal" },
  { from: "ceo", to: "cmo", action: "Утвердил план",                 thought: "Утверждаю: новое позиционирование + этап 1 экспансии с 1 августа",  kind: "decision" },
  { from: "ar",  to: "cto", action: "Улучшил модель скоринга",       thought: "Точность прогноза выручки выросла до 91% на бэктестах",             kind: "signal" },
];

// ─── Radar (6 осей) ───────────────────────────────────────────────────────────
const RADAR = [
  { l: "Рост",       v: 0.86 }, { l: "Риск",     v: 0.62 }, { l: "Финансы",  v: 0.9 },
  { l: "Маркетинг",  v: 0.84 }, { l: "Продажи",  v: 0.78 }, { l: "Операции", v: 0.88 },
];

// ─── Профили для Command Mode ────────────────────────────────────────────────
const FOCUS: Record<string, { now: string; tasks: string[]; decision: string }> = {
  ceo: { now: "Синтез позиций совета по экспансии",            tasks: ["Утвердить план Q3", "Ревью KPI департаментов", "Подготовка к раунду"],            decision: "Экспансия в 2 этапа с контролем burn" },
  cfo: { now: "Стресс-тест финмодели экспансии",               tasks: ["Пересчёт runway", "Бюджет этапа 1", "Отчёт инвесторам"],                          decision: "Лимит просадки кэша — 8%" },
  cmo: { now: "Подготовка каналов к этапу 1",                  tasks: ["Медиаплан августа", "Новое позиционирование", "Раскатка A/B на 100%"],            decision: "Фокус на B2B-сегмент" },
  coo: { now: "Масштабирование операций под рост",             tasks: ["Цикл заявок < 30ч", "Найм в саппорт", "Комплаенс новых рынков"],                   decision: "SLA сохраняем при ×2 нагрузке" },
  cto: { now: "Готовность платформы к ×3 нагрузке",            tasks: ["API-интеграции", "Реалтайм-метрики", "Модель скоринга v2"],                        decision: "Инфра-бюджет не увеличиваем" },
};
const FOCUS_DEFAULT = (n: Node) => ({ now: `${n.role}: текущий анализ`, tasks: ["Сбор данных", "Анализ", "Отчёт руководителю"], decision: "Передаёт выводы в C-level" });

const KIND_META = { signal: { l: "СИГНАЛ", c: "#60a5fa" }, debate: { l: "ДЕБАТЫ", c: "#fbbf24" }, decision: { l: "РЕШЕНИЕ", c: "#34d399" } } as const;

// ─── Board Battle: вопрос → CEO → дебаты → вердикт ───────────────────────────
type BattleMsg = { agent: string; text: string; done: boolean };
type Battle = {
  q: string;
  phase: "route" | "debate" | "verdict" | "done";
  debaters: string[];
  msgs: BattleMsg[];
  verdict: string;
  current?: string;
  offline?: boolean;
};

function pickDebaters(q: string): string[] {
  const s = q.toLowerCase();
  const picks = new Set<string>();
  if (/(финанс|деньг|бюджет|цен|стоимост|инвест|прибыл|выручк|касс|окупа)/.test(s)) { picks.add("cfo"); picks.add("ia"); }
  if (/(маркет|клиент|прода|рост|реклам|бренд|аудитор|канал|конверси)/.test(s)) { picks.add("cmo"); picks.add("gh"); }
  if (/(продукт|технолог|разработ|ai|ии|фич|интеграц|платформ|данн)/.test(s)) { picks.add("cto"); picks.add("pm"); }
  if (/(риск|опас|провал|конкурент|угроз)/.test(s)) picks.add("ra");
  if (/(команд|найм|сотрудник|процесс|операц|юрид|договор)/.test(s)) picks.add("coo");
  const arr = Array.from(picks).slice(0, 3);
  while (arr.length < 3) for (const d of ["cfo", "cmo", "cto"]) { if (arr.length < 3 && !arr.includes(d)) arr.push(d); }
  return arr;
}


// офлайн-сценарий, если API недоступен — совет всё равно «думает»
const FALLBACK_OPINIONS: Record<string, string> = {
  cfo: "ПРОТИВ поспешности. Сначала считаем юнит-экономику: если LTV/CAC ниже 3, идея съест кэш быстрее, чем даст выручку. Предлагаю пилот с жёстким лимитом бюджета и точкой пересмотра через 30 дней.",
  cmo: "ЗА, но с фокусом. Спрос проверяем дешёвым тестом: лендинг + 2 канала трафика, решение по данным конверсии, а не по ощущениям. Если CTR и заявки выше бенчмарка — масштабируем.",
  cto: "РИСКОВАННО без прототипа. Технически реализуемо, но закладываю 2–3 недели на MVP и интеграции. Предлагаю начать с самого узкого сценария, который проверяет гипотезу, — остальное не строим, пока нет спроса.",
  coo: "ЗА при готовых процессах. До запуска нужны: ответственный владелец, SLA на обработку заявок и чек-лист комплаенса. Иначе рост превратится в хаос поддержки.",
  ia: "Смотрю на цифры: рынок должен позволять x10 от текущей выручки, иначе усилия не окупятся. Прошу неделю на оценку TAM/SAM и сравнимые сделки — потом дам точную рекомендацию.",
  gh: "ЗА быстрый эксперимент. За 7 дней прогоняю A/B: два оффера, два сегмента, бюджет минимальный. Данные покажут, где спрос настоящий — дальше вкладываемся только туда.",
  pm: "Смотрю от пользователя: какую боль решаем и почему сейчас? Предлагаю 5 проблемных интервью до строчки кода. Если боль подтверждается — режем скоуп до одной ключевой фичи.",
  ra: "Главные риски: конкуренты с большим бюджетом и регуляторика. Оба управляемы, если входим поэтапно и не жжём больше 10% резерва. Стоп-лосс обязателен.",
};
const FALLBACK_VERDICT = "Вердикт совета: гипотеза достойна проверки, но входим поэтапно. Шаг 1 — дешёвый тест спроса за 7–14 дней с жёстким лимитом бюджета. Шаг 2 — если метрики выше порога, собираем минимальный MVP. Шаг 3 — пересмотр через 30 дней по фактическим цифрам, а не ожиданиям. Полный анализ доступен после подключения API-ключа.";

// ─── Layout: орбиты вокруг ядра ──────────────────────────────────────────────
const W = 880, H = 600, CX = W / 2, CY = H / 2 - 10;

function orbitPos() {
  const pos: Record<string, { x: number; y: number }> = {};
  // CEO + chiefs — внутренняя орбита
  const inner = [CEO, ...CHIEFS];
  inner.forEach((n, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / inner.length;
    pos[n.id] = { x: CX + 158 * Math.cos(a), y: CY + 138 * Math.sin(a) };
  });
  // специалисты — внешняя орбита
  SPECIALISTS.forEach((n, i) => {
    const a = -Math.PI / 2 + Math.PI / 12 + (i * 2 * Math.PI) / SPECIALISTS.length;
    pos[n.id] = { x: CX + 330 * Math.cos(a), y: CY + 242 * Math.sin(a) };
  });
  return pos;
}
const POS = orbitPos();

// ─── Page ─────────────────────────────────────────────────────────────────────
type LogItem = Ev & { t: string; id: number };

export default function ExecutivesPage() {
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<LogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [question, setQuestion] = useState("");
  const battleBusy = battle !== null && battle.phase !== "done";
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || battle) return;
    const iv = setInterval(() => setStep(s => s + 1), 2600);
    return () => clearInterval(iv);
  }, [paused, battle]);

  // ── Board Battle runner ──
  const appendToLast = useCallback((t: string) => {
    setBattle(b => {
      if (!b || b.msgs.length === 0) return b;
      const msgs = [...b.msgs];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: msgs[msgs.length - 1].text + t };
      return { ...b, msgs };
    });
  }, []);

  const runBattle = useCallback(async (q: string) => {
    setSelected(null);
    const debaters = pickDebaters(q);
    setBattle({ q, phase: "route", debaters, msgs: [], verdict: "" });
    await new Promise(r => setTimeout(r, 1200));

    const opinions: { id: string; text: string }[] = [];
    let offline = false;

    for (const id of debaters) {
      const n = byId[id];
      setBattle(b => b && ({ ...b, phase: "debate", current: id, offline, msgs: [...b.msgs, { agent: id, text: "", done: false }] }));
      const prev = opinions.map(o => `${byId[o.id].name} (${byId[o.id].role}): ${o.text}`).join("\n\n");
      const persona = `Ты — ${n.name}, ${n.role} в совете директоров Apex AI. Основатель задал совету вопрос. ${prev ? `Мнения коллег до тебя:\n${prev}\n\nМожешь согласиться или аргументированно поспорить с ними — это дебаты.` : "Ты выступаешь первым."} Ответь на русском. Максимум 4 предложения. Начни с чёткой позиции одним словом в верхнем регистре (ЗА / ПРОТИВ / РИСКОВАННО), затем аргументы строго из твоей зоны ответственности. Конкретика и цифры, никакой воды. Обычный текст без markdown-разметки (никаких ** и #).`;
      let text = "";
      if (!offline) {
        try {
          text = await streamChat(q, persona, appendToLast);
        } catch { offline = true; }
      }
      if (offline) {
        text = FALLBACK_OPINIONS[id] ?? FALLBACK_OPINIONS.cfo;
        for (const ch of text) { appendToLast(ch); await new Promise(r => setTimeout(r, 9)); }
      }
      opinions.push({ id, text });
      setBattle(b => {
        if (!b) return b;
        const msgs = [...b.msgs];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], done: true };
        return { ...b, msgs, offline };
      });
      await new Promise(r => setTimeout(r, 350));
    }

    setBattle(b => b && ({ ...b, phase: "verdict", current: "ceo" }));
    const ceoPersona = `Ты — Sophia Rivers, CEO совета директоров Apex AI. Основатель задал вопрос, совет провёл дебаты. Мнения:\n${opinions.map(o => `${byId[o.id].name}: ${o.text}`).join("\n\n")}\n\nВынеси финальный вердикт на русском: взвесь споры, прими однозначное решение и дай 2–3 конкретных следующих шага. Максимум 6 предложений. Обычный текст без markdown-разметки (никаких ** и #).`;
    if (!offline) {
      try {
        await streamChat(q, ceoPersona, t => setBattle(b => b && ({ ...b, verdict: b.verdict + t })));
      } catch { offline = true; }
    }
    if (offline) {
      for (const ch of FALLBACK_VERDICT) {
        setBattle(b => b && ({ ...b, verdict: b.verdict + ch }));
        await new Promise(r => setTimeout(r, 9));
      }
    }
    setBattle(b => b && ({ ...b, phase: "done", current: undefined, offline }));
  }, [appendToLast]);

  const submitQuestion = useCallback(() => {
    const q = question.trim();
    if (!q || battleBusy) return;
    setQuestion("");
    void runBattle(q);
  }, [question, battleBusy, runBattle]);

  useEffect(() => {
    const ev = SCRIPT[step % SCRIPT.length];
    const t = new Date();
    const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
    setLog(l => [{ ...ev, t: ts, id: step }, ...l].slice(0, 24));
  }, [step]);

  // активные связи = последние 3 события
  const active = useMemo(() => log.slice(0, 3), [log]);
  const current = log[0];
  const activeIds = useMemo(() => new Set(active.flatMap(e => [e.from, e.to])), [active]);

  const onSelect = useCallback((id: string) => setSelected(s => (s === id ? null : id)), []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const sel = selected ? byId[selected] : null;
  const selFocus = sel ? (FOCUS[sel.id] ?? FOCUS_DEFAULT(sel)) : null;
  // связи выбранного агента из скрипта
  const selLinks = useMemo(() => {
    if (!selected) return [];
    const ids = new Set<string>();
    SCRIPT.forEach(e => { if (e.from === selected) ids.add(e.to); if (e.to === selected) ids.add(e.from); });
    return Array.from(ids);
  }, [selected]);

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", padding: "28px 28px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{"// EXECUTIVE INTELLIGENCE"}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.02em" }}>
            Живой интеллект совета <span className="term-blink" style={{ color: "#6366f1" }}>▋</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {selected ? `Командный режим: ${byId[selected].name}. Esc — выход.` : "20 агентов думают, спорят и принимают решения вокруг ядра. Кликните агента — командный режим."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="term-mono" style={{ fontSize: 11, color: current ? KIND_META[current.kind].c : "rgba(255,255,255,0.4)" }}>
            ● {current ? KIND_META[current.kind].l : "OFFLINE"}
          </span>
          <button onClick={() => setPaused(p => !p)}
            className="term-mono"
            style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer" }}>
            {paused ? "▶ ВОЗОБНОВИТЬ" : "‖ ПАУЗА"}
          </button>
        </div>
      </div>

      {/* ── Вопрос совету ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", padding: "12px 16px", borderRadius: 14, border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)" }}>
        <span className="term-mono" style={{ color: "#818cf8", fontSize: 13, flexShrink: 0 }}>{">"}</span>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submitQuestion(); }}
          disabled={battleBusy}
          placeholder="Задайте вопрос совету — CEO раскидает его директорам, они устроят дебаты и вынесут вердикт…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E5E7EB", fontSize: 13.5, minWidth: 0 }}
        />
        <button onClick={submitQuestion} disabled={battleBusy || !question.trim()}
          className="term-mono"
          style={{ padding: "9px 18px", borderRadius: 10, border: "none", fontSize: 11, fontWeight: 800, cursor: battleBusy ? "wait" : "pointer", color: "#fff", background: "linear-gradient(135deg,#6366f1,#4f46e5)", opacity: battleBusy || !question.trim() ? 0.55 : 1, flexShrink: 0 }}>
          {battleBusy ? "СОВЕТ ДУМАЕТ…" : "▸ СПРОСИТЬ СОВЕТ"}
        </button>
        {battle && !battleBusy && (
          <button onClick={() => setBattle(null)} className="term-mono"
            style={{ padding: "9px 14px", borderRadius: 10, fontSize: 11, cursor: "pointer", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            СБРОС
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 16, alignItems: "start" }}>
        {/* ── Living field ── */}
        <div style={{ borderRadius: 22, border: "1px solid rgba(255,255,255,0.07)", background: "radial-gradient(ellipse at 50% 42%, rgba(99,102,241,0.08), transparent 55%), rgba(255,255,255,0.015)", overflow: "hidden", position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <radialGradient id="exl-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
              {ALL.map(n => (
                <linearGradient key={n.id} id={`exl-g-${n.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={n.g[0]} /><stop offset="100%" stopColor={n.g[1]} />
                </linearGradient>
              ))}
            </defs>

            {/* орбиты */}
            <ellipse cx={CX} cy={CY} rx={158} ry={138} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6" />
            <ellipse cx={CX} cy={CY} rx={330} ry={242} fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 6" />

            {/* связи выбранного агента (command mode) */}
            {sel && selLinks.map(id => {
              const a = POS[sel.id], b = POS[id];
              return (
                <path key={id} d={`M${a.x},${a.y} Q${CX},${CY} ${b.x},${b.y}`} fill="none"
                  stroke={sel.c} strokeWidth={1.4} strokeOpacity={0.5} strokeDasharray="5 5"
                  style={{ animation: "exl-dash 1.2s linear infinite" }} />
              );
            })}

            {/* связи батла: CEO → дебатёры */}
            {battle && [ "ceo", ...battle.debaters ].map(id => {
              if (id === "ceo") return null;
              const a = POS.ceo, b = POS[id];
              const isCur = battle.current === id;
              const c = byId[id].c;
              const d = `M${a.x},${a.y} Q${CX},${CY} ${b.x},${b.y}`;
              return (
                <g key={`bt-${id}`}>
                  <path d={d} fill="none" stroke={c} strokeWidth={isCur ? 2.2 : 1.2} strokeOpacity={isCur ? 0.8 : 0.35} strokeDasharray="6 6" style={{ animation: "exl-dash 1.1s linear infinite" }} />
                  {isCur && (
                    <circle r={4} fill={c}>
                      <animateMotion dur="1.3s" repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}
            {battle?.phase === "verdict" && (
              <circle cx={POS.ceo.x} cy={POS.ceo.y} r={42} fill="none" stroke="#818cf8" strokeWidth={1.6} strokeOpacity={0.7}
                style={{ animation: "exl-ping 1.4s ease-out infinite", transformOrigin: `${POS.ceo.x}px ${POS.ceo.y}px` }} />
            )}

            {/* живые связи последних событий */}
            {!sel && !battle && active.map((e, i) => {
              const a = POS[e.from], b = POS[e.to];
              if (!a || !b) return null;
              const d = `M${a.x},${a.y} Q${CX},${CY} ${b.x},${b.y}`;
              const c = byId[e.from].c;
              return (
                <g key={e.id} opacity={1 - i * 0.32}>
                  <path d={d} fill="none" stroke={c} strokeWidth={i === 0 ? 1.8 : 1.1} strokeOpacity={0.55} strokeDasharray="6 6" style={{ animation: "exl-dash 1.1s linear infinite" }} />
                  {i === 0 && !paused && (
                    <circle r={3.5} fill={c}>
                      <animateMotion dur="1.6s" repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* ядро сознания */}
            <g style={{ cursor: "default" }}>
              <circle cx={CX} cy={CY} r={92} fill="url(#exl-core)" style={paused ? undefined : { animation: "exl-breathe 3.2s ease-in-out infinite" }} />
              <circle cx={CX} cy={CY} r={46} fill="#0B0D16" stroke="rgba(129,140,248,0.5)" strokeWidth={1.2} />
              <circle cx={CX} cy={CY} r={58} fill="none" stroke="rgba(99,102,241,0.35)" strokeWidth={1} strokeDasharray="3 7" style={paused ? undefined : { animation: "exl-spin 14s linear infinite", transformOrigin: `${CX}px ${CY}px` }} />
              <text x={CX} y={CY - 4} textAnchor="middle" fill="#E5E7EB" fontSize={13} fontWeight={800} fontFamily="var(--font-geist-mono), monospace">APEX</text>
              <text x={CX} y={CY + 12} textAnchor="middle" fill="rgba(129,140,248,0.9)" fontSize={9} fontFamily="var(--font-geist-mono), monospace" letterSpacing="2">CORE</text>
            </g>

            {/* агенты */}
            {ALL.map(n => {
              const p = POS[n.id];
              const isSel = selected === n.id;
              const isActive = activeIds.has(n.id) && !selected && !battle;
              const inBattle = battle ? (n.id === "ceo" || battle.debaters.includes(n.id)) : false;
              const isSpeaking = battle?.current === n.id;
              const dim = battle ? (inBattle ? 1 : 0.15) : selected ? (isSel || selLinks.includes(n.id) ? 1 : 0.18) : 1;
              const r = n.id === "ceo" ? 30 : CHIEFS.some(c => c.id === n.id) ? 26 : 21;
              return (
                <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: "pointer", opacity: dim, transition: "opacity 0.35s" }}>
                  {(isActive || isSel || isSpeaking) && (
                    <circle cx={p.x} cy={p.y} r={r + 7} fill="none" stroke={n.c} strokeWidth={1.4} strokeOpacity={0.65}
                      style={paused ? undefined : { animation: "exl-ping 1.6s ease-out infinite", transformOrigin: `${p.x}px ${p.y}px` }} />
                  )}
                  <circle cx={p.x} cy={p.y} r={r} fill={`url(#exl-g-${n.id})`} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#fff" fontSize={r > 24 ? 11 : 9.5} fontWeight={800} fontFamily="var(--font-geist-mono), monospace">{n.ab}</text>
                  <text x={p.x} y={p.y + r + 15} textAnchor="middle" fill={isSel ? n.c : "rgba(255,255,255,0.6)"} fontSize={9.5} fontFamily="var(--font-geist-mono), monospace" paintOrder="stroke" stroke="#05060A" strokeWidth={3}>{n.name}</text>
                </g>
              );
            })}
          </svg>

          {/* текущая мысль поверх поля */}
          <AnimatePresence mode="wait">
            {current && !selected && !battle && (
              <motion.div key={current.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", left: 16, bottom: 14, right: 16, display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 12, background: "rgba(5,6,10,0.82)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
                <span className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: KIND_META[current.kind].c, whiteSpace: "nowrap", marginTop: 2 }}>▸ {byId[current.from].ab} → {byId[current.to].ab}</span>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>{current.thought}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right rail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Battle / Command mode / Debate stream */}
          {battle ? (
            <div style={{ borderRadius: 16, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(255,255,255,0.02)", padding: 16 }}>
              <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{"// СОВЕТ-БАТЛ"}</div>
              <div style={{ fontSize: 12.5, color: "#E5E7EB", fontWeight: 600, lineHeight: 1.45, marginBottom: 10 }}>«{battle.q}»</div>
              {battle.phase === "route" && (
                <div className="term-mono" style={{ fontSize: 11, color: "#818cf8" }}>
                  ▸ CEO распределяет вопрос: {battle.debaters.map(d => byId[d].ab).join(" · ")}<span className="term-blink">▋</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                {battle.msgs.map((m, i) => {
                  const n = byId[m.agent];
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                      style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, background: `linear-gradient(135deg,${n.g[0]},${n.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{n.ab}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="term-mono" style={{ fontSize: 9.5, color: n.c, marginBottom: 2 }}>{n.name.toUpperCase()}</div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                          {m.text.replace(/\*\*/g, "")}{!m.done && <span className="term-blink" style={{ color: n.c }}>▋</span>}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                {(battle.phase === "verdict" || battle.phase === "done") && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: 12, border: "1px solid rgba(129,140,248,0.4)", background: "rgba(99,102,241,0.08)", padding: 12 }}>
                    <div className="term-mono" style={{ fontSize: 9.5, color: "#818cf8", marginBottom: 4 }}>▸ ВЕРДИКТ CEO</div>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>
                      {battle.verdict.replace(/\*\*/g, "")}{battle.phase === "verdict" && <span className="term-blink" style={{ color: "#818cf8" }}>▋</span>}
                    </p>
                  </motion.div>
                )}
              </div>
              {battle.offline && battle.phase === "done" && (
                <div className="term-mono" style={{ fontSize: 10, color: "rgba(251,191,36,0.8)", marginTop: 8 }}>⚠ OFFLINE-РЕЖИМ: API-ключ не настроен, показан демо-сценарий</div>
              )}
            </div>
          ) : sel && selFocus ? (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ borderRadius: 16, border: `1px solid ${sel.c}44`, background: "rgba(255,255,255,0.025)", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${sel.g[0]},${sel.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{sel.ab}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB" }}>{sel.name}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{sel.role} · score {sel.score}</div>
                </div>
              </div>
              <div className="term-label" style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{"// СЕЙЧАС"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 1.5 }}>{selFocus.now}</div>
              <div className="term-label" style={{ color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{"// ЗАДАЧИ"}</div>
              {selFocus.tasks.map(t => (
                <div key={t} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginBottom: 5 }}>
                  <span style={{ color: sel.c }}>▸</span>{t}
                </div>
              ))}
              <div className="term-label" style={{ color: "rgba(255,255,255,0.35)", margin: "10px 0 4px" }}>{"// ПОСЛЕДНЕЕ РЕШЕНИЕ"}</div>
              <div style={{ fontSize: 12.5, color: sel.c, lineHeight: 1.5 }}>{selFocus.decision}</div>
              <Link href={`/dashboard/chat?agent=${sel.id}`} className="term-mono"
                style={{ display: "block", marginTop: 14, padding: "10px", borderRadius: 10, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg,${sel.g[0]},${sel.g[1]})`, textDecoration: "none" }}>
                ▸ ОБСУДИТЬ С {sel.ab}
              </Link>
            </motion.div>
          ) : (
            <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 16 }}>
              <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{"// ДЕБАТЫ СОВЕТА · LIVE"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 236, overflow: "hidden" }}>
                <AnimatePresence initial={false}>
                  {log.slice(0, 5).map(e => (
                    <motion.div key={e.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, background: `linear-gradient(135deg,${byId[e.from].g[0]},${byId[e.from].g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 800, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{byId[e.from].ab}</span>
                      <div style={{ minWidth: 0 }}>
                        <span className="term-mono" style={{ fontSize: 9.5, color: KIND_META[e.kind].c }}>{KIND_META[e.kind].l}</span>
                        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.45, margin: 0 }}>{e.thought}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Executive Radar */}
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 16 }}>
            <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{"// EXECUTIVE RADAR"}</div>
            <Radar />
          </div>
        </div>
      </div>

      {/* ── Intelligence Timeline ── */}
      <div style={{ marginTop: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "14px 16px" }}>
        <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{"// INTELLIGENCE TIMELINE — журнал решений"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 176, overflowY: "auto" }}>
          <AnimatePresence initial={false}>
            {log.map(e => (
              <motion.div key={e.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                className="term-mono" style={{ display: "flex", gap: 12, fontSize: 11, alignItems: "baseline" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{e.t}</span>
                <span style={{ color: KIND_META[e.kind].c, flexShrink: 0, width: 62 }}>{KIND_META[e.kind].l}</span>
                <span style={{ color: byId[e.from].c, flexShrink: 0 }}>{byId[e.from].ab}→{byId[e.to].ab}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.action}: {e.thought}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @keyframes exl-dash { to { stroke-dashoffset: -24; } }
        @keyframes exl-breathe { 0%,100% { opacity: 0.75; } 50% { opacity: 1; } }
        @keyframes exl-spin { to { transform: rotate(360deg); } }
        @keyframes exl-ping { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          [style*="exl-"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── 6-axis radar ────────────────────────────────────────────────────────────
function Radar() {
  const S = 210, C = S / 2, R = 62;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / RADAR.length;
    return [C + R * v * Math.cos(a), C + R * v * Math.sin(a)] as const;
  };
  const poly = RADAR.map((d, i) => pt(i, d.v).join(",")).join(" ");
  return (
    <svg viewBox={`-24 -6 ${S + 48} ${S + 12}`} style={{ width: "100%", maxWidth: 250, display: "block", margin: "0 auto" }}>
      {[0.33, 0.66, 1].map(f => (
        <polygon key={f} points={RADAR.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.07)" />
      ))}
      {RADAR.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />; })}
      <motion.polygon points={poly} fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth={1.4}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "50% 50%" }} />
      {RADAR.map((d, i) => {
        const [x, y] = pt(i, 1.28);
        const anchor = Math.abs(x - C) < 8 ? "middle" : x > C ? "start" : "end";
        return <text key={d.l} x={x} y={y + 3} textAnchor={anchor} fill="rgba(255,255,255,0.55)" fontSize={8.5} fontFamily="var(--font-geist-mono), monospace">{d.l.toUpperCase()}</text>;
      })}
      {RADAR.map((d, i) => { const [x, y] = pt(i, d.v); return <circle key={i} cx={x} cy={y} r={2.2} fill="#818cf8" />; })}
    </svg>
  );
}
