import { ImageResponse } from "next/og";

// Картинка для шаринга (Telegram, X, Slack, поисковики). Собрана из реального
// позиционирования продукта — никаких выдуманных цифр и отзывов.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vertlix AI — your AI executive board";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 84px", background: "#05060A", color: "#fff",
          backgroundImage: "radial-gradient(900px 420px at 78% 12%, rgba(124,58,237,0.28), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 42 }}>
          <div style={{ width: 62, height: 62, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.16em" }}>VERTLIX AI</div>
        </div>

        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 900 }}>
          Your AI board of directors
        </div>
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.55)", marginTop: 26, maxWidth: 860, lineHeight: 1.4 }}>
          CEO, CFO, CMO, COO and 16 more agents — strategy, plan and pitch deck in minutes
        </div>
      </div>
    ),
    size,
  );
}
