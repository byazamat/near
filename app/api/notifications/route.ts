import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  let query = supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, all } = await request.json();

  if (!all && !(Array.isArray(ids) && ids.length > 0)) {
    return NextResponse.json({ error: "ids or all is required" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.userId);

  if (!all) {
    query = query.in("id", ids);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
