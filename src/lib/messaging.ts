import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { firebaseApp, db } from "./firebase";

export type EnableResult = { ok: true } | { ok: false; error: string };

export type NotificationSettings = {
  enabled: boolean;
  reminderTime: string; // "HH:mm", 24h
  tokenCount: number;
};

function notificationSettingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "notifications");
}

export function subscribeNotificationSettings(uid: string, onData: (settings: NotificationSettings) => void) {
  return onSnapshot(notificationSettingsRef(uid), (snap) => {
    const data = snap.data();
    onData({
      enabled: data?.enabled ?? false,
      reminderTime: data?.reminderTime ?? "20:00",
      tokenCount: Array.isArray(data?.fcmTokens) ? data.fcmTokens.length : 0,
    });
  });
}

export async function setReminderSettings(uid: string, enabled: boolean, reminderTime: string) {
  await setDoc(notificationSettingsRef(uid), { enabled, reminderTime }, { merge: true });
}

export async function enablePushNotifications(uid: string): Promise<EnableResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, error: "Browser ini gak support notifikasi." };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { ok: false, error: "Browser ini gak support push notification (FCM)." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Izin notifikasi ditolak. Aktifkan lewat pengaturan browser kalau berubah pikiran." };
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { ok: false, error: "VAPID key belum di-setup (NEXT_PUBLIC_FIREBASE_VAPID_KEY kosong)." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) {
      return { ok: false, error: "Gagal dapetin token notifikasi." };
    }

    await setDoc(notificationSettingsRef(uid), { fcmTokens: arrayUnion(token) }, { merge: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal aktifin notifikasi." };
  }
}

export async function disablePushNotifications(uid: string) {
  if (typeof window === "undefined") return;
  const supported = await isSupported().catch(() => false);
  if (!supported) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(firebaseApp);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      await setDoc(notificationSettingsRef(uid), { fcmTokens: arrayRemove(token) }, { merge: true });
    }
  } catch {
    // best-effort cleanup — ignore failures
  }
}

// Shows a notification for FCM messages that arrive while the app is
// already open in the foreground (background messages are handled by
// the service worker's own onBackgroundMessage handler instead).
export async function listenForegroundMessages() {
  if (typeof window === "undefined") return () => {};
  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};

  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Life Tracker";
    const body = payload.notification?.body ?? "";
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    }
  });
}
