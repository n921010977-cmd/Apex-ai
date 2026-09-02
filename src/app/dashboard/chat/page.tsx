"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { markVisit } from "@/components/dashboard/EngagementPanel";

// Экран выбора агентов удалён: «AI Чат» сразу открывает новый диалог.
// ?agent=<slug> сохраняется — так карточки директоров с дашборда открывают
// диалог с конкретным директором и его командой.
function ChatIndexRedirect() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => { markVisit("chat"); }, []);

  useEffect(() => {
    const agent = sp.get("agent");
    if (!agent) {
      // общий ассистент — чистим профиль конкретного агента
      try { localStorage.removeItem("apex-chat-agent"); } catch { /* ignore */ }
    }
    router.replace(`/dashboard/chat/local-${Date.now()}${agent ? `?agent=${encodeURIComponent(agent)}` : ""}`);
  }, [router, sp]);

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05060A" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.6)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        Открываю чат…
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ChatIndexPage() {
  return (
    <Suspense fallback={null}>
      <ChatIndexRedirect />
    </Suspense>
  );
}
