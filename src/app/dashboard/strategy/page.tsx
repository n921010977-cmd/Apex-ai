import { redirect } from "next/navigation";

// У стратегии нет индексной страницы — есть только /dashboard/strategy/[id]
// с готовым документом. Прямой заход (закладка, ручной ввод адреса) ведём на
// создание новой стратегии, а не в 404.
export default function StrategyIndexPage() {
  redirect("/dashboard/new");
}
