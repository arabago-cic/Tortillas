import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth";
import { saveSubscription, sendPushToAll, PushSubscriptionData } from "../services/push";

const router = Router();

/**
 * POST /api/notifications/subscribe
 * Save a push subscription (public).
 * Body: { endpoint: string, keys: { p256dh: string, auth: string } }
 */
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({
        error: "Invalid subscription. Required: endpoint, keys.p256dh, keys.auth",
      });
      return;
    }

    const subscription: PushSubscriptionData = {
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    };

    await saveSubscription(subscription);
    res.status(201).json({ message: "Subscription saved" });
  } catch (error: any) {
    console.error("Failed to save subscription:", error.message);
    res.status(500).json({ error: "Failed to save push subscription" });
  }
});

/**
 * POST /api/notifications/test
 * Send a test push notification to all subscribers (admin only).
 * Body: { title?: string, body?: string }
 */
router.post("/test", requireAdmin, async (req: Request, res: Response) => {
  try {
    const title = req.body.title || "Test Notification";
    const body = req.body.body || "This is a test notification from Tortilla Calendar";

    const result = await sendPushToAll(title, body);

    res.json({
      message: "Test notification sent",
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error("Failed to send test notification:", error.message);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
