"use client";

import { useState } from "react";
import { Presentation, Sparkles, Download, Loader2, RotateCcw, Globe } from "lucide-react";
import { INDUSTRIES } from "@/lib/industries";
import { track, EVENTS } from "@/lib/analytics/events";

// ─── Питч-дек для инвестора — киллер-артефакт ─────────────────────────────────
// Из короткого брифа собирается инвесторская презентация (10 слайдов), которую
// можно посмотреть тут же и скачать готовым HTML-файлом. Отличие от ChatGPT: не
// текст в окне, а документ, который открывается как презентация.

const ACCENT = "#6366f1";
const RGB = "99,102,241";

type Metric = { label: string; value: string };
interface Deck {
  company?: string;
  tagline?: string;
  slides?: Record<string, {
    headline?: string; sub?: string; note?: string;
    bullets?: string[]; edge?: string[]; use?: string[];
    tam?: string; sam?: string; som?: string;
    amount?: string; milestone?: string;
    metrics?: Metric[];
  }>;
}
type SlideMeta = { key: string; title: string };

const EXAMPLES = [
  "SaaS для автоматизации найма в IT-компаниях",
  "Сеть кофеен формата to-go у метро",
  "Маркетплейс аренды спецтехники для строек",
];

import { PlanGate } from "@/components/dashboard/PlanGate";

export default function PitchDeckPage() {
  return <PlanGate feature="pitchDeck"><PitchDeckInner /></PlanGate>;
}

function PitchDeckInner() {
  const [brief, setBrief] = useState("");
  const [industry, setIndustry] = useState("saas");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [order, setOrder] = useState<SlideMeta[]>([]);
  const [research, setResearch] = useState(false);
  const [researched, setResearched] = useState(false);

  const generate = async () => {
    if (brief.trim().length < 15) { setError("Опишите бизнес хотя бы одним предложением"); return; }
    setBusy(true); setError(""); setDeck(null);
    try {
      const res = await fetch("/api/artifacts/pitch-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim(), industry, research }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Не удалось собрать дек"); return; }
      setDeck(data.deck); setOrder(data.slideOrder || []); setResearched(!!data.researched);
      track(EVENTS.REPORT_GENERATED, { artifact: "pitch_deck", industry });
    } catch { setError("Ошибка сети"); }
    finally { setBusy(false); }
  };

  const download = () => {
    if (!deck) return;
    const html = buildDeckHtml(deck, order);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pitch-${(deck.company || "deck").toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px rgba(${RGB},0.35)` }}>
          <Presentation size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Питч-дек для инвестора</h1>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Готовая презентация из одного описания — 10 слайдов, скачивается файлом</div>
        </div>
      </div>

      {/* Brief input */}
      <div style={{ marginTop: 22, borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", padding: 18 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Опишите бизнес</label>
        <textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Что за продукт, для кого, как зарабатывает, на какой вы стадии…"
          rows={4}
          style={{ width: "100%", resize: "vertical", borderRadius: 11, padding: "12px 14px", fontSize: 14, lineHeight: 1.6, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 4px" }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setBrief(ex)} disabled={busy}
              style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {ex}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "14px 0 8px" }}>Ниша</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {INDUSTRIES.map(ind => {
            const sel = industry === ind.id;
            return (
              <button key={ind.id} onClick={() => setIndustry(ind.id)} disabled={busy} title={ind.revenueModel}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 9, fontSize: 12.5, fontWeight: 650, cursor: "pointer", color: sel ? "#fff" : "rgba(255,255,255,0.55)", background: sel ? `rgba(${RGB},0.16)` : "rgba(255,255,255,0.03)", border: sel ? `1px solid rgba(${RGB},0.45)` : "1px solid rgba(255,255,255,0.08)" }}>
                <span>{ind.emoji}</span><span>{ind.label.split(" / ")[0]}</span>
              </button>
            );
          })}
        </div>

        <button onClick={() => setResearch(v => !v)} disabled={busy}
          style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, padding: "9px 12px", borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left", background: research ? `rgba(${RGB},0.1)` : "rgba(255,255,255,0.03)", border: research ? `1px solid rgba(${RGB},0.4)` : "1px solid rgba(255,255,255,0.08)" }}>
          <Globe size={15} color={research ? "#a5b4fc" : "rgba(255,255,255,0.4)"} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 650, color: research ? "#fff" : "rgba(255,255,255,0.7)" }}>Свежие данные с рынка</span>
            <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Веб-поиск актуальных цифр по рынку и конкурентам (дольше, точнее)</span>
          </span>
          <span style={{ position: "relative", width: 38, height: 22, borderRadius: 11, flexShrink: 0, background: research ? ACCENT : "rgba(255,255,255,0.12)", transition: "background .2s" }}>
            <span style={{ position: "absolute", top: 2, left: research ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </span>
        </button>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={generate} disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 20px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: busy ? "default" : "pointer", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, boxShadow: `0 6px 22px rgba(${RGB},0.32)`, opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={15} />}
            {busy ? "Собираю дек…" : deck ? "Пересобрать" : "Собрать питч-дек"}
          </button>
          {deck && !busy && (
            <button onClick={download}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 650, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Download size={14} /> Скачать презентацию
            </button>
          )}
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: "#fca5a5" }}>{error}</div>}
      </div>

      {/* Deck preview */}
      {deck && (
        <div style={{ marginTop: 24 }}>
          {deck.company && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{deck.company}</div>
                {researched && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 650, padding: "3px 9px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
                    <Globe size={11} /> на свежих данных
                  </span>
                )}
              </div>
              {deck.tagline && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{deck.tagline}</div>}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {order.map((meta, i) => {
              const s = deck.slides?.[meta.key];
              if (!s) return null;
              return (
                <div key={meta.key} style={{ borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", padding: 18, minHeight: 150 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${RGB},0.85)`, marginBottom: 8 }}>{String(i + 1).padStart(2, "0")} · {meta.title}</div>
                  {s.headline && <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.35 }}>{s.headline}</div>}
                  {s.sub && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{s.sub}</div>}
                  {(s.tam || s.sam || s.som) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {[["TAM", s.tam], ["SAM", s.sam], ["SOM", s.som]].filter(x => x[1]).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12, padding: "4px 9px", borderRadius: 8, background: `rgba(${RGB},0.1)`, border: `1px solid rgba(${RGB},0.2)`, color: "#c7d2fe" }}><b>{k}</b> {v}</div>
                      ))}
                    </div>
                  )}
                  {s.metrics && s.metrics.length > 0 && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                      {s.metrics.map((m, j) => (
                        <div key={j}><div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{m.value}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.label}</div></div>
                      ))}
                    </div>
                  )}
                  {s.amount && <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>{s.amount}</div>}
                  {[s.bullets, s.edge, s.use].map((list, li) => list && (
                    <ul key={li} style={{ margin: "4px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {list.map((b, j) => (
                        <li key={j} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, display: "flex", gap: 7 }}>
                          <span style={{ color: ACCENT, flexShrink: 0 }}>▸</span><span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ))}
                  {s.note && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 8, fontStyle: "italic" }}>{s.note}</div>}
                  {s.milestone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>🎯 {s.milestone}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            <RotateCcw size={12} /> Дек — черновик от AI: проверьте цифры и адаптируйте под себя перед отправкой инвестору.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Сборка самодостаточного HTML-файла презентации ───────────────────────────
// Один файл, открывается в любом браузере, слайды листаются стрелками. Без
// внешних ресурсов — можно отправить инвестору как вложение.
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function buildDeckHtml(deck: Deck, order: SlideMeta[]): string {
  const slides = order.map((meta, i) => {
    const s = deck.slides?.[meta.key];
    if (!s) return "";
    const parts: string[] = [];
    parts.push(`<div class="tag">${String(i + 1).padStart(2, "0")} · ${esc(meta.title)}</div>`);
    if (s.headline) parts.push(`<h2>${esc(s.headline)}</h2>`);
    if (s.sub) parts.push(`<p class="sub">${esc(s.sub)}</p>`);
    if (s.tam || s.sam || s.som) parts.push(`<div class="chips">${[["TAM", s.tam], ["SAM", s.sam], ["SOM", s.som]].filter(x => x[1]).map(([k, v]) => `<span><b>${k}</b> ${esc(v)}</span>`).join("")}</div>`);
    if (s.amount) parts.push(`<div class="amount">${esc(s.amount)}</div>`);
    if (s.metrics?.length) parts.push(`<div class="metrics">${s.metrics.map(m => `<div><span class="mv">${esc(m.value)}</span><span class="ml">${esc(m.label)}</span></div>`).join("")}</div>`);
    for (const list of [s.bullets, s.edge, s.use]) if (list?.length) parts.push(`<ul>${list.map(b => `<li>${esc(b)}</li>`).join("")}</ul>`);
    if (s.note) parts.push(`<p class="note">${esc(s.note)}</p>`);
    if (s.milestone) parts.push(`<p class="ms">🎯 ${esc(s.milestone)}</p>`);
    return `<section class="slide">${parts.join("")}</section>`;
  }).join("");

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(deck.company || "Pitch Deck")}</title>
<style>
*{box-sizing:border-box;margin:0}body{background:#05060a;color:#e5e7eb;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
.deck{max-width:960px;margin:0 auto}
.slide{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:8vh 6vw;border-bottom:1px solid rgba(255,255,255,.06)}
.cover h1{font-size:clamp(32px,7vw,64px);font-weight:800;letter-spacing:-.02em}
.cover p{font-size:clamp(15px,2.5vw,22px);color:rgba(255,255,255,.5);margin-top:12px}
.tag{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#818cf8;margin-bottom:14px}
h2{font-size:clamp(22px,4vw,38px);font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:16px}
.sub{font-size:clamp(15px,2vw,19px);color:rgba(255,255,255,.6);margin-bottom:14px}
ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;margin-top:8px}
li{font-size:clamp(14px,1.8vw,18px);line-height:1.5;padding-left:24px;position:relative;color:rgba(255,255,255,.82)}
li:before{content:"▸";position:absolute;left:0;color:#6366f1}
.chips{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}
.chips span{font-size:15px;padding:8px 14px;border-radius:10px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);color:#c7d2fe}
.amount{font-size:clamp(28px,5vw,48px);font-weight:800;color:#34d399;margin:8px 0}
.metrics{display:flex;gap:32px;flex-wrap:wrap;margin:12px 0}
.mv{display:block;font-size:clamp(22px,4vw,36px);font-weight:800;color:#fff}
.ml{display:block;font-size:14px;color:rgba(255,255,255,.4)}
.note{font-size:14px;color:rgba(255,255,255,.4);font-style:italic;margin-top:14px}
.ms{font-size:16px;color:rgba(255,255,255,.6);margin-top:10px}
.hint{position:fixed;bottom:16px;right:20px;font-size:12px;color:rgba(255,255,255,.3)}
@media print{.slide{min-height:auto;page-break-after:always;border:none}.hint{display:none}}
</style></head><body>
<div class="deck">
<section class="slide cover"><h1>${esc(deck.company || "")}</h1><p>${esc(deck.tagline || deck.slides?.title?.sub || "")}</p></section>
${slides}
</div>
<div class="hint">↓ листайте · Ctrl+P → PDF</div>
</body></html>`;
}
