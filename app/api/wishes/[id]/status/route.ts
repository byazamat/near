import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendToAdmin } from "@/lib/telegram";
import { createAndSendNotification } from "@/lib/notifications";

const TRANSITIONS: Record<string, { role: "admin" | "user"; next: string[] }> = {
  waiting: { role: "admin", next: ["in_progress", "cancelled"] },
  in_progress: { role: "admin", next: ["pending_confirmation", "cancelled"] },
  pending_confirmation: { role: "user", next: ["fulfilled", "waiting"] },
};

function notificationFor(from: string, to: string, title: string) {
  if (from === "waiting" && to === "in_progress") {
    return {
      title: "✨ Кое-что началось...",
      body: "Один из твоих желаний в процессе. Скоро узнаешь какой 🤫",
    };
  }
  if (from === "in_progress" && to === "pending_confirmation") {
    return {
      title: "🎁 Готово!",
      body: `«${title}» ждёт твоего подтверждения`,
    };
  }
  if (to === "cancelled") {
    return {
      title: "💔 Изменения",
      body: `«${title}» был отменён`,
    };
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status: nextStatus } = await request.json();

  const { data: wish } = await supabaseAdmin
    .from("wishes")
    .select("*")
    .eq("id", id)
    .single();

  if (!wish) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role !== "admin" && wish.user_id !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const transition = TRANSITIONS[wish.status];
  if (
    !transition ||
    transition.role !== user.role ||
    !transition.next.includes(nextStatus)
  ) {
    return NextResponse.json(
      { error: `Cannot transition from ${wish.status} to ${nextStatus}` },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabaseAdmin
    .from("wishes")
    .update({ status: nextStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.role === "admin") {
    const notification = notificationFor(wish.status, nextStatus, wish.title);
    if (notification) {
      await createAndSendNotification({
        userId: wish.user_id,
        title: notification.title,
        body: notification.body,
        type: "wish_status",
        metadata: { wishId: wish.id, status: nextStatus },
        sendPush: true,
      });
    }
  }

  if (wish.status === "pending_confirmation" && nextStatus === "fulfilled") {
    await sendToAdmin(`🎉 ${user.username} подтвердила выполнение: «${wish.title}»`);
  }

  return NextResponse.json({ wish: updated });
}
