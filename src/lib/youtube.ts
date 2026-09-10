import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const API = "https://www.googleapis.com/youtube/v3";

export type YouTubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
};

export type YouTubeStats = {
  channelId: string;
  title: string;
  avatar: string;
  subscribers: number;
  views: number;
  videoCount: number;
  recent: YouTubeVideo[];
};

export function hasYouTubeKey() {
  return Boolean(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
}

function brandingSettingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "branding");
}

export function subscribeYouTubeChannel(uid: string, onData: (channel: string) => void) {
  return onSnapshot(brandingSettingsRef(uid), (snap) => {
    onData((snap.data()?.youtubeChannel as string) ?? "");
  });
}

export async function setYouTubeChannel(uid: string, youtubeChannel: string) {
  await setDoc(brandingSettingsRef(uid), { youtubeChannel }, { merge: true });
}

async function call(path: string, params: Record<string, string>) {
  const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!key) throw new Error("youtube.noKey");

  const query = new URLSearchParams({ ...params, key });
  const res = await fetch(`${API}/${path}?${query}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `YouTube API ${res.status}`);
  }
  return res.json();
}

/**
 * Accepts a channel ID (UC...) or a handle (@name / name). Handles are resolved
 * by the API itself, so no extra search request — and no search quota — is needed.
 */
export async function fetchChannelStats(channel: string): Promise<YouTubeStats> {
  const trimmed = channel.trim();
  const lookup: Record<string, string> = trimmed.startsWith("UC")
    ? { id: trimmed }
    : { forHandle: trimmed.startsWith("@") ? trimmed : `@${trimmed}` };

  const data = await call("channels", {
    part: "snippet,statistics,contentDetails",
    ...lookup,
  });

  const item = data.items?.[0];
  if (!item) throw new Error("youtube.channelNotFound");

  const uploads = item.contentDetails?.relatedPlaylists?.uploads;
  let recent: YouTubeVideo[] = [];
  if (uploads) {
    const playlist = await call("playlistItems", {
      part: "snippet",
      playlistId: uploads,
      maxResults: "3",
    });
    recent = (playlist.items ?? []).map((v: Record<string, never>) => {
      const snippet = v.snippet as unknown as {
        title: string;
        publishedAt: string;
        resourceId: { videoId: string };
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
      return {
        id: snippet.resourceId.videoId,
        title: snippet.title,
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails.medium?.url ?? snippet.thumbnails.default?.url ?? "",
      };
    });
  }

  return {
    channelId: item.id,
    title: item.snippet.title,
    avatar: item.snippet.thumbnails?.default?.url ?? "",
    subscribers: Number(item.statistics.subscriberCount ?? 0),
    views: Number(item.statistics.viewCount ?? 0),
    videoCount: Number(item.statistics.videoCount ?? 0),
    recent,
  };
}

export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
