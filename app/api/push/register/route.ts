import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fcmToken } = await request.json();

  if (!fcmToken) {
    return NextResponse.json({ error: "fcmToken is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ fcm_token: fcmToken })
    .eq("id", user.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
