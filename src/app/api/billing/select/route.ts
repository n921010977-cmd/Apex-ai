import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLAN_COOKIE } from "@/lib/server/plan";

// Ставит активный тариф пользователя в httpOnly-cookie. Пока нет реальной оплаты
// это и есть «покупка»; когда подключим LemonSqueezy, тариф будет ставиться
// вебхуком после успешной оплаты, а не этим роутом.

const VALID = new Set(["starter", "pro", "max", "none"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const plan = body.plan;
  if (!plan || !VALID.has(plan)) {
    return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 422 });
  }

  const res = NextResponse.json({ success: true, plan });
  res.cookies.set(PLAN_COOKIE, plan, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 31, // ~месяц
  });
  return res;
}
