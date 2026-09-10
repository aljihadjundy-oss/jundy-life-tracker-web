"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  enablePushNotifications,
  setReminderSettings,
  subscribeNotificationSettings,
  type NotificationSettings,
} from "@/lib/messaging";
import Switch from "./components/Switch";
import { setLanguage, useLanguage, useT } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";

export default function PengaturanPage() {
  return (
    <AppShell>
      <PengaturanContent />
    </AppShell>
  );
}

function PengaturanContent() {
  const { user } = useAuth();
  const t = useT();
  const lang = useLanguage();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    reminderTime: "20:00",
    tokenCount: 0,
  });
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeNotificationSettings(user.uid, setSettings);
  }, [user]);

  async function handleEnable() {
    if (!user) return;
    setEnabling(true);
    setError(null);
    const result = await enablePushNotifications(user.uid);
    if (!result.ok) {
      setError(result.error);
    } else {
      setPermission("granted");
      if (!settings.enabled) {
        await setReminderSettings(user.uid, true, settings.reminderTime);
      }
    }
    setEnabling(false);
  }

  async function handleToggleReminder(next: boolean) {
    if (!user) return;
    await setReminderSettings(user.uid, next, settings.reminderTime);
  }

  async function handleTimeChange(time: string) {
    if (!user) return;
    await setReminderSettings(user.uid, settings.enabled, time);
  }

  const isActive = permission === "granted" && settings.tokenCount > 0;

  return (
    <>
      <TopBar title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="mt-2 flex flex-col gap-3 px-5 pb-6">
        <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
          <h2 className="text-sm font-bold text-ink">{t("settings.language")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{t("settings.languageHint")}</p>
          <div className="mt-3 flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  lang === l.value ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
          <h2 className="text-sm font-bold text-ink">{t("settings.pushTitle")}</h2>
<p className="mt-1 text-xs text-ink-muted">{t("settings.pushHint")}</p>

          <button
            onClick={handleEnable}
            disabled={enabling || isActive}
            className="mt-3 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
          >
            {isActive ? t("settings.pushActive") : enabling ? t("settings.pushEnabling") : t("settings.pushEnable")}
          </button>

          {permission === "denied" && (
<p className="mt-2 text-xs text-red-500">{t("settings.pushDenied")}</p>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">{t("settings.reminderTitle")}</h2>
<p className="mt-1 text-xs text-ink-muted">{t("settings.reminderHint")}</p>
            </div>
            <Switch checked={settings.enabled} onChange={handleToggleReminder} />
          </div>

          <label className={`mt-3 block ${settings.enabled ? "" : "pointer-events-none opacity-40"}`}>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("settings.reminderTime")}</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-ink"
            />
          </label>
        </div>

<p className="px-1 text-[11px] leading-relaxed text-ink-muted">{t("settings.reminderNote")}</p>
      </div>
    </>
  );
}
