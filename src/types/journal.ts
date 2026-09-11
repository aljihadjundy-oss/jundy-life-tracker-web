export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: string; // emoji, empty string if unset
  date: string; // ISO date (yyyy-mm-dd)
  /**
   * A voice recording exists for this entry. The audio itself lives in
   * IndexedDB on the device that recorded it, so this being true does not
   * guarantee the clip is present on the device you are reading from.
   */
  hasAudio: boolean;
  audioSeconds: number;
  createdAt: number; // epoch millis
  updatedAt: number; // epoch millis
};

export type NewJournalEntry = Pick<
  JournalEntry,
  "title" | "content" | "mood" | "date" | "hasAudio" | "audioSeconds"
>;

export const MOODS = ["😄", "🙂", "😐", "😔", "😢"] as const;
