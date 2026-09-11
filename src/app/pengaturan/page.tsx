"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { reportFailure } from "@/lib/notify";
import {
  enablePushNotifications,
  setReminderSettings,
  subscribeNotificationSettings,
  type NotificationSettings,
} from "@/lib/messaging";
import BackupCard from "./components/BackupCard";
import SkinCard from "./components/SkinCard";
import Switch from "./components/Switch";
import UnitsCard from "./components/UnitsCard";
import PillarsCard from "./components/PillarsCard";
import ProfileSheet from "./components/ProfileSheet";
import { useUserConfig } from "@/lib/user-context";
import { saveProfile, setPillars } from "@/lib/profile";
import { ageFrom } from "@/types/profile";
import { setUnits, subscribeWaktuSettings } from "@/lib/waktu";
import { DEFAULT_WAKTU_SETTINGS, type WaktuSettings } from "@/types/waktu";
import { setLanguage, useLanguage, useT } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";
import { setDailyGoal, subscribeStats } from "@/lib/gamification";
import { DAILY_GOAL_OPTIONS, EMPTY_STATS, type GameStats } from "@/types/gamification";

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
  const [gameStats, setGameStats] = useState<GameStats>(EMPTY_STATS);
  const [waktuSettings, setWaktuSettings] = useState<WaktuSettings>(DEFAULT_WAKTU_SETTINGS);
  const { profile, pillars } = useUserConfig();
  const [showProfile, setShowProfile] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubSettings = subscribeNotificationSettings(user.uid, setSettings);
    const unsubStats = subscribeStats(user.uid, setGameStats);
    const unsubWaktu = subscribeWaktuSettings(user.uid, setWaktuSettings);
    return () => {
      unsubSettings();
      unsubStats();
      unsubWaktu();
    };
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
        reportFailure(
          setReminderSettings(user.uid, true, settings.reminderTime),
          t("notify.saveFailed")
        );
      }
    }
    setEnabling(false);
  }

  function handleToggleReminder(next: boolean) {
    if (!user) return;
    reportFailure(
      setReminderSettings(user.uid, next, settings.reminderTime),
      t("notify.saveFailed")
    );
  }

  function handleTimeChange(time: string) {
    if (!user) return;
    reportFailure(setReminderSettings(user.uid, settings.enabled, time), t("notify.saveFailed"));
  }

  const isActive = permission === "granted" && settings.tokenCount > 0;

  return (
    <>
      <TopBar title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="mt-2 flex flex-col gap-3 px-5 pb-6">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 text-left shadow-sm ring-1 ring-border/60 transition active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-start via-brand-mid to-brand-end text-sm font-bold text-white">
            {(profile.displayName || "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">
              {profile.displayName || t("home.noName")}
            </span>
            <span className="block truncate text-[11px] text-ink-muted">
              {[
                profile.gender !== "unset" ? t(`onboarding.gender.${profile.gender}`) : "",
                profile.occupation,
                ageFrom(profile.birthDate) !== null
                  ? t("home.ageYears", { count: ageFrom(profile.birthDate) ?? 0 })
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || t("settings.profileHint")}
            </span>
          </span>
          <span className="shrink-0 text-xs text-ink-muted">›</span>
        </button>

        <PillarsCard
          pillars={pillars}
          onChange={(patch) => user && setPillars(user.uid, patch)}
        />

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
          <h2 className="text-sm font-bold text-ink">{t("game.dailyGoal")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{t("game.dailyGoalHint")}</p>
          <div className="mt-3 flex gap-2">
            {DAILY_GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                onClick={() => user && setDailyGoal(user.uid, goal)}
                className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                  gameStats.dailyGoal === goal ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t("game.xpPerDay", { xp: goal })}
              </button>
            ))}
          </div>
        </div>

        {pillars.time && (
          <UnitsCard
            units={waktuSettings.units}
            onChange={(units) => user && setUnits(user.uid, units)}
          />
        )}

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

        <SkinCard />

        <BackupCard uid={user?.uid} />

        <BuildStamp />
      </div>

      {showProfile && (
        <ProfileSheet
          profile={profile}
          onSubmit={async (patch) => {
            if (user) reportFailure(saveProfile(user.uid, patch), t("notify.saveFailed"));
          }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

/**
 * Which build this device is actually running. After a deploy, an installed
 * PWA can keep serving an older shell for a while; comparing this line between
 * phone and laptop tells you straight away whether the update landed.
 */
function BuildStamp() {
  const t = useT();
  const stamp = process.env.NEXT_PUBLIC_BUILD_TIME;
  if (!stamp) return null;

  const built = new Date(stamp);
  return (
    <p className="pt-1 text-center text-[11px] text-ink-muted">
      {t("settings.buildVersion", {
        version: `${built.toISOString().slice(0, 10)} ${built
          .toISOString()
          .slice(11, 16)} UTC`,
      })}
    </p>
  );
}
