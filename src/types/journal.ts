export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: string; // emoji, empty string if unset
  date: string; // ISO date (yyyy-mm-dd)
  createdAt: number; // epoch millis
  updatedAt: number; // epoch millis
};

export type NewJournalEntry = Pick<JournalEntry, "title" | "content" | "mood" | "date">;

export const MOODS = ["😄", "🙂", "😐", "😔", "😢"] as const;
