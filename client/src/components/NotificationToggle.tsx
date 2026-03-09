import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellIcon, BellOffIcon } from "lucide-react";
import { subscribePush } from "@/lib/api";

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    // Check existing subscription
    void navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) setEnabled(true);
    });
  }, []);

  async function handleToggle() {
    if (!supported) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (enabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        setEnabled(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setLoading(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY as
            | string
            | undefined,
        });

        const json = sub.toJSON();
        const keys = json.keys as Record<string, string> | undefined;

        if (json.endpoint && keys?.p256dh && keys.auth) {
          await subscribePush({
            endpoint: json.endpoint,
            keys: {
              p256dh: keys.p256dh,
              auth: keys.auth,
            },
          });
        }

        setEnabled(true);
      }
    } catch (err) {
      console.error("Error gestionando notificaciones:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => { void handleToggle(); }}
      disabled={loading}
      title={enabled ? "Desactivar notificaciones" : "Activar notificaciones"}
    >
      {enabled ? <BellIcon className="text-amber-600" /> : <BellOffIcon />}
    </Button>
  );
}
