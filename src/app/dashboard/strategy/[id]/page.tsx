"use client";

// Старые ссылки на этот путь ведут на страницу проекта (вкладки
// Диагностика/AI Команда/Финансы/Рынок/Риски внутри дашборда).
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyStrategyRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  useEffect(() => { router.replace(`/dashboard/projects/${id}`); }, [id, router]);
  return <div style={{ minHeight: "100vh", background: "#05060A" }} />;
}
