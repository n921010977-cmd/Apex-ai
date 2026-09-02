"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Loader2 } from "lucide-react";

// ─── Блок «Have a promo code?» на странице тарифов ───────────────────────────
// Заменяет прежний блок «How payment works» — активирует код на сервере
// (/api/promo/redeem), тариф выдаёт только он, кнопка ничего не включает сама.

const ACCENT = "#7C3AED";
const RGB = "124,58,237";
const EASE = [0.22, 1, 0.36, 1] as const;

export function PromoRedeem({ onRedeemed }: { onRedeemed?: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ text: data.error ?? "Could not apply this code", ok: false });
      } else {
        setMessage({ text: `Basic plan activated for ${data.days} days`, ok: true });
        setCode("");
        onRedeemed?.();
      }
    } catch {
      setMessage({ text: "Network error, please try again", ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{ marginTop: 44, borderRadius: 18, padding: "22px 24px", background: `linear-gradient(180deg, rgba(${RGB},0.06), rgba(${RGB},0.015))`, border: `1px solid rgba(${RGB},0.18)` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <Ticket size={16} style={{ color: "#c4b5fd" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Have a promo code?</span>
      </div>

      <form onSubmit={submit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter promo code"
          disabled={busy}
          style={{
            flex: "1 1 200px", height: 44, padding: "0 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          style={{
            height: 44, padding: "0 22px", borderRadius: 10, border: "none",
            cursor: busy || !code.trim() ? "default" : "pointer",
            background: `linear-gradient(135deg,${ACCENT},#6D28D9)`, color: "#fff",
            fontSize: 13.5, fontWeight: 700, opacity: busy || !code.trim() ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          Apply
        </button>
      </form>

      {message && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: message.ok ? "#6ee7b7" : "#fca5a5" }}>
          {message.text}
        </div>
      )}
    </motion.div>
  );
}
