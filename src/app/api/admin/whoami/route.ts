import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";

// GET /api/admin/whoami — «я админ?» одним булевым значением.
// Нужен интерфейсу, чтобы показывать/скрывать пункт «Админка», не зашивая
// email администратора в браузерный бандл. Роль решает сервер; ответ не
// содержит ни email, ни других персональных данных.

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  return NextResponse.json({ admin: admin.ok });
}
