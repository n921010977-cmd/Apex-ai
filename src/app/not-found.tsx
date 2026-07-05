import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          404
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Страница не найдена</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
          Похоже, этой страницы не существует или она была перемещена. Проверьте адрес или вернитесь на главную.
        </p>
        <Link href="/dashboard"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
          На дашборд
        </Link>
      </div>
    </div>
  );
}
