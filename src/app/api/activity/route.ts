import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { activityService } from "@/lib/services/activity.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const logs = await activityService.findMany(session.user.id!);
  return NextResponse.json({ success: true, data: logs });
}
