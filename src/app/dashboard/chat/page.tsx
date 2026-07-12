"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Экран выбора агентов удалён: «AI Чат» сразу открывает новый диалог.
export default function ChatIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    // общий ассистент — без профиля конкретного агента
    try { localStorage.removeItem("apex-chat-agent"); } catch { /* ignore */ }
    router.replace(`/dashboard/chat/local-${Date.now()}`);
  }, [router]);

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05060A" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.6)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        Открываю чат…
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
