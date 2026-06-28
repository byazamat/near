import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendToAdmin } from "@/lib/telegram";

const ACTIVE_STATUSES = ["waiting", "in_progress", "pending_confirmation"];

const CATEGORIES = ["sparkle", "dream", "desire"];

function maskWish(wish: Record<string, unknown>, role: string) {
  if (role === "admin") return wish;
  const rest = { ...wish };
  delete rest.admin_note;
  if (rest.status === "in_progress") {
    return { ...rest, status: "🤫 Сюрприз в процессе" };
  }
  return rest;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("wishes")
    .select("*")
    .order("created_at", { ascending: false });

  if (user.role !== "admin") {
    query = query.eq("user_id", user.userId);
  }

  if (status === "active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (status === "done") {
    query = query.eq("status", "fulfilled");
  }

  const { data: wishes, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    wishes: wishes.map((wish) => maskWish(wish, user.role)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, category } = await request.json();

  if (!title || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid title or category" }, { status: 400 });
  }

  const { data: wish, error } = await supabaseAdmin
    .from("wishes")
    .insert({
      user_id: user.userId,
      title,
      description: description ?? null,
      category,
      status: "waiting",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sendToAdmin(`✨ Новое желание от ${user.username}: «${title}»`);

  return NextResponse.json({ wish });
}
