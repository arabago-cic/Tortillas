import webPush from "web-push";
import { db } from "../db";
import { pushSubscriptions } from "../db/schema";

/**
 * Initialize web-push with VAPID keys from environment variables.
 */
export function initWebPush(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webPush.setVapidDetails(
      "mailto:" + (process.env.SMTP_FROM || "tortillas@example.com"),
      publicKey,
      privateKey
    );
    console.log("Web Push configured with VAPID keys");
  } else {
    console.log("Web Push not configured: VAPID keys missing");
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Save a push subscription to the database.
 */
export async function saveSubscription(subscription: PushSubscriptionData): Promise<void> {
  await db.insert(pushSubscriptions).values({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
}

/**
 * Send a push notification to all saved subscriptions.
 */
export async function sendPushToAll(title: string, body: string): Promise<{ sent: number; failed: number }> {
  let allSubscriptions;
  try {
    allSubscriptions = await db.select().from(pushSubscriptions);
  } catch {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({ title, body });
  let sent = 0;
  let failed = 0;

  for (const sub of allSubscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webPush.sendNotification(pushSubscription, payload);
      sent++;
    } catch (error: any) {
      failed++;
      // If subscription is expired (410 Gone), remove it
      if (error.statusCode === 410) {
        try {
          const { eq } = await import("drizzle-orm");
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  return { sent, failed };
}

/**
 * Send a push notification about today's tortilla assignment.
 */
export async function sendTortillaNotification(
  memberName: string,
  date: string
): Promise<{ sent: number; failed: number }> {
  return sendPushToAll(
    "Tortilla Calendar",
    `${memberName} brings tortillas today (${date})`
  );
}
