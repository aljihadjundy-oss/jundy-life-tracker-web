/**
 * Jurnal kini menampung dua hal sekaligus: catatan harian, dan naskah.
 *
 * Bentuknya mengikuti template Notion yang sudah dipakai — dua basis data yang
 * saling terhubung, Writing dan Topics. Yang dibawa ke sini adalah kolom yang
 * benar-benar dipakai di sana: jenis tulisan, topik, ringkasan, penanda
 * favorit, selesai, dan arsip.
 *
 * Kolom `Place` dan `Related Notes` sengaja belum dibawa: di ekspor yang ada
 * keduanya kosong di seluruh 34 baris, jadi memodelkannya sekarang berarti
 * menambah bidang yang tidak pernah diisi.
 */

/**
 * Jenis tulisan. "journal" ada di depan karena itu yang dipakai catatan harian
 * — entri lama tidak punya bidang ini sama sekali, dan membaca nilai yang
 * hilang sebagai "journal" membuat semuanya tetap sah tanpa migrasi data.
 */
export const WRITING_TYPES = ["journal", "poetry", "script", "article", "unspoken"] as const;

export type WritingType = (typeof WRITING_TYPES)[number];

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

  type: WritingType;
  /** Id topik dari koleksi terpisah — sebuah tulisan boleh punya lebih dari satu. */
  topicIds: string[];
  /** Kalimat pembuka atau intisari, seperti kolom Description di Notion. */
  description: string;
  favorite: boolean;
  /** Selesai vs masih draf. Di Notion ini kolom Finished. */
  finished: boolean;
  /** Disingkirkan dari daftar tanpa dihapus. */
  archived: boolean;

  createdAt: number; // epoch millis
  updatedAt: number; // epoch millis
};

export type NewJournalEntry = Pick<
  JournalEntry,
  | "title"
  | "content"
  | "mood"
  | "date"
  | "hasAudio"
  | "audioSeconds"
  | "type"
  | "topicIds"
  | "description"
  | "favorite"
  | "finished"
  | "archived"
>;

export const MOODS = ["😄", "🙂", "😐", "😔", "😢"] as const;

/** Topik, koleksi tersendiri supaya bisa diganti nama tanpa menyentuh tulisan. */
export type Topic = {
  id: string;
  name: string;
  archived: boolean;
  createdAt: number;
};

export type NewTopic = Pick<Topic, "name" | "archived">;

/**
 * Topik bawaan saat pertama kali dipakai — sama persis dengan yang ada di
 * template Notion-nya, supaya tulisan yang diimpor langsung menemukan
 * pasangannya alih-alih membuat duplikat.
 */
export const DEFAULT_TOPICS = [
  "Philosophy",
  "Technology",
  "Politics",
  "Social Media & Digital Skills",
  "Communication",
  "Productivity",
  "Business",
  "Personal Development",
] as const;

/** Nilai untuk entri baru; juga dipakai sebagai bekal saat membaca entri lama. */
export const EMPTY_WRITING_FIELDS = {
  type: "journal" as WritingType,
  topicIds: [] as string[],
  description: "",
  favorite: false,
  finished: false,
  archived: false,
};
