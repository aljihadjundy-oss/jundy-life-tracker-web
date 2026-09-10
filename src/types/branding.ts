export type ContentStatus = "draft" | "ready" | "posted";

export type ContentItem = {
  id: string;
  title: string;
  platform: string;
  postDate: string; // ISO date (yyyy-mm-dd)
  status: ContentStatus;
  note: string;
  createdAt: number; // epoch millis
};

export type NewContentItem = Omit<ContentItem, "id" | "createdAt">;

export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Threads", "LinkedIn"] as const;

export const PLATFORM_EMOJI: Record<string, string> = {
  Instagram: "📸",
  TikTok: "🎵",
  YouTube: "▶️",
  Threads: "🧵",
  LinkedIn: "💼",
};

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  ready: "Siap Posting",
  posted: "Posted",
};

export const STATUS_ORDER: ContentStatus[] = ["draft", "ready", "posted"];

export function nextStatus(status: ContentStatus): ContentStatus {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}
