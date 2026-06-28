import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

if (
  getApps().length === 0 &&
  FIREBASE_PROJECT_ID &&
  FIREBASE_CLIENT_EMAIL &&
  FIREBASE_PRIVATE_KEY
) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY,
    }),
  });
}

export async function sendPush(
  fcmToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!fcmToken || getApps().length === 0) {
    console.log("[firebase] missing token or app config, skipping push:", title);
    return;
  }

  try {
    await getMessaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (error) {
    console.log("[firebase] error sending push:", error);
  }
}
