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
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: calls, error } = await supabaseAdmin
    .from("location_calls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { latitude, longitude, address } = await request.json();

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { data: call, error } = await supabaseAdmin
    .from("location_calls")
    .insert({
      user_id: user.userId,
      latitude,
      longitude,
      address: address ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sendToAdmin(
    `🗺 Она нажала кнопку! Местоположение: https://maps.yandex.ru/?pt=${longitude},${latitude}&z=16&l=map\nАдрес: ${address ?? "не указан"}`
  );

  return NextResponse.json({ call });
}
