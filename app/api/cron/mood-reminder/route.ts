import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPush } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, fcm_token")
    .eq("role", "user");

  for (const user of users ?? []) {
    const { data: entry } = await supabaseAdmin
      .from("mood_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (!entry) {
      await sendPush(
        user.fcm_token,
        "🌙 Как прошёл день?",
        "Расскажи мне о своём настроении сегодня ✨"
      );
    }
  }

  return NextResponse.json({ success: true });
}
