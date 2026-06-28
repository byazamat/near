import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendToAdmin } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const queryUserId = searchParams.get("userId");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let targetUserId = user.userId;
  if (queryUserId) {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = queryUserId;
  }

  let query = supabaseAdmin
    .from("mood_entries")
    .select("*")
    .eq("user_id", targetUserId)
    .order("date", { ascending: false });

  if (year && month) {
    const paddedMonth = month.padStart(2, "0");
    const start = `${year}-${paddedMonth}-01`;
    const endDate = new Date(Number(year), Number(month), 1);
    const end = endDate.toISOString().slice(0, 10);
    query = query.gte("date", start).lt("date", end);
  } else if (year) {
    query = query.gte("date", `${year}-01-01`).lt("date", `${Number(year) + 1}-01-01`);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { score, comment, date } = await request.json();

  if (typeof score !== "number" || score < 0 || score > 10) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const entryDate = date ?? new Date().toISOString().slice(0, 10);

  const { data: entry, error } = await supabaseAdmin
    .from("mood_entries")
    .upsert(
      {
        user_id: user.userId,
        score,
        comment: comment ?? null,
        date: entryDate,
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sendToAdmin(
    `🌙 ${user.username} отметила настроение: ${score}/10${comment ? `\n💬 ${comment}` : ""}`
  );

  return NextResponse.json({ entry });
}
