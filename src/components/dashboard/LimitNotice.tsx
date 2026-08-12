"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/lib/track-client";

// ─── Понятное окно при упоре в лимит или закрытую функцию ─────────────────────
// Сервер отвечает 429 (QUOTA_EXCEEDED), 403 (FEATURE_LOCKED) или 402
// (PLAN_REQUIRED). Чтобы не переписывать десяток мест вызова, один раз
// оборачиваем window.fetch и показываем объяснение с кнопкой «Обновить тариф».
// Ответ при этом не подменяется — вызывающий код получает его как обычно.

const RGB = "99,102,241";

interface Info { code: string; error: string; limit?: number | null; used?: number; requiredPlan?: string | null; resetAt?: number }

const CODES = new Set(["QUOTA_EXCEEDED", "FEATURE_LOCKED", "PLAN_REQUIRED"]);

export function LimitNotice() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (...args) => {
      const res = await orig(...args);
      if (res.status === 429 || res.status === 403 || res.status === 402) {
        // Читаем копию: тело оригинального ответа остаётся нетронутым.
        res.clone().json().then((d: Info) => {
          if (d && CODES.has(d.code)) setInfo(d);
        }).catch(() => {});
      }
      return res;
    };
    return () => { window.fetch = orig; };
  }, []);

  const title = info?.code === "QUOTA_EXCEEDED"
    ? "Месячный лимит исчерпан"
    : "Функция закрыта на вашем тарифе";

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setInfo(null)}
          style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(5,6,10,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "min(440px,100%)", borderRadius: 22, padding: "28px 26px", textAlign: "center", position: "relative",
              background: `linear-gradient(180deg, rgba(${RGB},0.1), rgba(255,255,255,0.02)), #0a0b12`,
              border: `1px solid rgba(${RGB},0.25)`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.5)" }}
          >
            <button onClick={() => setInfo(null)} aria-label="Закрыть"
              style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} />
            </button>

            <div style={{ width: 54, height: 54, borderRadius: 16, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: `0 10px 28px rgba(${RGB},0.4)` }}>
              <Lock size={22} color="#fff" />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.6)", margin: "0 0 6px" }}>{info.error}</p>
            {info.code === "QUOTA_EXCEEDED" && info.limit != null && (
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>
                Использовано {info.used ?? info.limit} из {info.limit} за месяц
              </p>
            )}
            {info.resetAt && (
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
                Лимит обновится {new Date(info.resetAt).toLocaleDateString("ru-RU")}
              </p>
            )}

            {/* Ведём на страницу тарифов — выбор тарифа делает пользователь,
                автоматически на оплату никого не отправляем. */}
            <Link href="/dashboard/billing"
              onClick={() => { trackEvent("upgrade_clicked", { from: info.code }); setInfo(null); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 24px", borderRadius: 13, textDecoration: "none", color: "#fff", fontSize: 14.5, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: `0 8px 24px rgba(${RGB},0.4), inset 0 1px 0 rgba(255,255,255,0.16)` }}>
              Выбрать тариф <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
