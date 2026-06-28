import { supabaseAdmin } from "@/lib/supabase";
import { sendPush } from "@/lib/firebase-admin";

interface CreateAndSendNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
  sendPush?: boolean;
}

export async function createAndSendNotification({
  userId,
  title,
  body,
  type,
  metadata,
  sendPush: shouldSendPush = false,
}: CreateAndSendNotificationParams): Promise<void> {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    body,
    type,
    metadata: metadata ?? null,
  });

  if (shouldSendPush) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("fcm_token")
      .eq("id", userId)
      .single();

    if (user?.fcm_token) {
      await sendPush(user.fcm_token, title, body);
    }
  }
}
