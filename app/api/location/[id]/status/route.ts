import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPush } from "@/lib/firebase-admin";

const VALID_STATUSES = ["seen", "on_the_way"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: call, error } = await supabaseAdmin
    .from("location_calls")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "on_the_way") {
    const { data: targetUser } = await supabaseAdmin
      .from("users")
      .select("fcm_token")
      .eq("id", call.user_id)
      .single();

    await sendPush(targetUser?.fcm_token, "💨 Уже еду!", "Он выезжает к тебе прямо сейчас 🚗");
  }

  return NextResponse.json({ call });
}
