"use client";

// Отчёт переехал на полноэкранный /report/[id] (без дашборд-обвязки — сразу
// после создания стратегии показывается только сам отчёт). Старые ссылки на
// этот путь остаются рабочими через редирект.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyStrategyRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  useEffect(() => { router.replace(`/report/${id}`); }, [id, router]);
  return <div style={{ minHeight: "100vh", background: "#05060A" }} />;
}
