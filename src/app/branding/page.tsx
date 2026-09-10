"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { addContent, deleteContent, subscribeContent, updateContentStatus } from "@/lib/branding";
import type { ContentItem, ContentStatus, NewContentItem } from "@/types/branding";
import { addDaysISO, todayISO } from "@/lib/format";
import ConsistencyCard from "./components/ConsistencyCard";
import PlatformChips from "./components/PlatformChips";
import ContentCard from "./components/ContentCard";
import ContentForm from "./components/ContentForm";
import { useT } from "@/lib/i18n";
import { awardXp } from "@/lib/gamification";
import { celebrate } from "@/lib/celebrate";

export default function BrandingPage() {
  return (
    <AppShell>
      <BrandingContent />
    </AppShell>
  );
}

function BrandingContent() {
  const { user } = useAuth();
  const t = useT();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeContent(user.uid, (items) => {
      setContent(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const postedDates = useMemo(
    () => new Set(content.filter((c) => c.status === "posted").map((c) => c.postDate)),
    [content]
  );

  const { streak, postsThisWeek, last14Days } = useMemo(() => {
    const today = todayISO();

    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = addDaysISO(today, i - 13);
      return { date, posted: postedDates.has(date) };
    });

    let streak = 0;
    for (let i = 0; ; i++) {
      const date = addDaysISO(today, -i);
      if (postedDates.has(date)) streak++;
      else break;
    }

    let postsThisWeek = 0;
    for (let i = 0; i < 7; i++) {
      if (postedDates.has(addDaysISO(today, -i))) postsThisWeek++;
    }

    return { streak, postsThisWeek, last14Days };
  }, [postedDates]);

  const filteredContent = useMemo(() => {
    const list = selectedPlatform ? content.filter((c) => c.platform === selectedPlatform) : content;
    return [...list].sort((a, b) => a.postDate.localeCompare(b.postDate));
  }, [content, selectedPlatform]);

  async function handleAdd(data: NewContentItem) {
    if (!user) return;
    await addContent(user.uid, data);
  }

  async function handleCycleStatus(id: string, status: ContentStatus) {
    if (!user) return;
    await updateContentStatus(user.uid, id, status);
    if (status === "posted") celebrate(await awardXp(user.uid, "post"));
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteContent(user.uid, id);
  }

  return (
    <>
      <TopBar title={t("branding.title")} subtitle={t("branding.subtitle")} />

      <ConsistencyCard streak={streak} postsThisWeek={postsThisWeek} last14Days={last14Days} />

      <div className="mt-5 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("branding.contentCalendar")}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
        >
          {t("app.add")}
        </button>
      </div>

      <div className="mt-3">
        <PlatformChips selected={selectedPlatform} onSelect={setSelectedPlatform} />
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && filteredContent.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">
              {selectedPlatform
                ? t("branding.emptyPlatform", { platform: selectedPlatform })
                : t("branding.empty")}
            </p>
          </div>
        )}

        {filteredContent.map((item) => (
          <ContentCard key={item.id} item={item} onCycleStatus={handleCycleStatus} onDelete={handleDelete} />
        ))}
      </div>

      {showForm && <ContentForm onSubmit={handleAdd} onClose={() => setShowForm(false)} />}
    </>
  );
}
