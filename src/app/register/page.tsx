import Link from "next/link";

export default function RegisterPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#05060A",
    }}>
      <div style={{
        textAlign: "center", padding: "48px 40px", borderRadius: 20, maxWidth: 420,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, margin: "0 auto 20px",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="22" height="22">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Регистрация временно закрыта
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, margin: "0 0 28px" }}>
          Мы готовимся к запуску.<br/>
          Новые аккаунты будут доступны совсем скоро.
        </p>
        <Link href="/login" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 44, padding: "0 28px", borderRadius: 12,
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          boxShadow: "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
          color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>
          Войти в аккаунт
        </Link>
      </div>
    </div>
  );
}
