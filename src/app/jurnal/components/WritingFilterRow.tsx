"use client";

import { WRITING_TYPES } from "@/types/journal";
import type { TopicCount, WritingFilters } from "@/lib/writing";
import { useT } from "@/lib/i18n";

/**
 * Baris penyaring perpustakaan tulisan.
 *
 * Jumlah ditempelkan pada tiap chip — itu padanan kolom rollup "Counter" di
 * Notion, dan tanpanya tidak ada cara tahu topik mana yang masih hidup selain
 * menekan satu per satu.
 */
export default function WritingFilterRow({
  filters,
  topics,
  onChange,
}: {
  filters: WritingFilters;
  topics: TopicCount[];
  onChange: (next: WritingFilters) => void;
}) {
  const t = useT();

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
    }`;

  return (
    <div className="space-y-2">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        <button className={chip(filters.type === "")} onClick={() => onChange({ ...filters, type: "" })}>
          {t("ops.all")}
        </button>
        {WRITING_TYPES.map((type) => (
          <button
            key={type}
            className={chip(filters.type === type)}
            onClick={() => onChange({ ...filters, type: filters.type === type ? "" : type })}
          >
            {t(`journal.type.${type}`)}
          </button>
        ))}
      </div>

      {topics.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
          {topics.map(({ topic, count }) => (
            <button
              key={topic.id}
              className={chip(filters.topicId === topic.id)}
              onClick={() =>
                onChange({ ...filters, topicId: filters.topicId === topic.id ? "" : topic.id })
              }
            >
              {topic.name}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        <button
          className={chip(filters.favoriteOnly)}
          onClick={() => onChange({ ...filters, favoriteOnly: !filters.favoriteOnly })}
        >
          ★ {t("journal.favorite")}
        </button>
        <button
          className={chip(filters.status === "finished")}
          onClick={() =>
            onChange({ ...filters, status: filters.status === "finished" ? "" : "finished" })
          }
        >
          {t("journal.finished")}
        </button>
        <button
          className={chip(filters.status === "draft")}
          onClick={() => onChange({ ...filters, status: filters.status === "draft" ? "" : "draft" })}
        >
          {t("journal.draft")}
        </button>
        <button
          className={chip(filters.showArchived)}
          onClick={() => onChange({ ...filters, showArchived: !filters.showArchived })}
        >
          {t("journal.archived")}
        </button>
      </div>
    </div>
  );
}
