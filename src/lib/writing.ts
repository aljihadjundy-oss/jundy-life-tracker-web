import type { JournalEntry, Topic, WritingType } from "@/types/journal";

/**
 * Penyaringan dan penghitungan untuk perpustakaan tulisan.
 *
 * Semua fungsi di sini murni — tanpa Firebase, tanpa React — supaya bisa diuji
 * langsung dan supaya aturan "apa yang tampil" hanya ada di satu tempat, bukan
 * tersebar sebagai kondisi di dalam JSX.
 */

export type WritingFilters = {
  /** "" berarti semua jenis. */
  type: WritingType | "";
  /** "" berarti semua topik. */
  topicId: string;
  search: string;
  favoriteOnly: boolean;
  /** "" semua, "finished" selesai saja, "draft" yang belum. */
  status: "" | "finished" | "draft";
  /** Arsip disembunyikan kecuali diminta — itu gunanya diarsipkan. */
  showArchived: boolean;
};

export const EMPTY_FILTERS: WritingFilters = {
  type: "",
  topicId: "",
  search: "",
  favoriteOnly: false,
  status: "",
  showArchived: false,
};

/**
 * Apakah ada penyaring aktif selain pencarian.
 *
 * Pencarian dikecualikan karena kotaknya sudah terlihat sendiri saat diisi;
 * yang perlu ditandai adalah penyaring yang tersembunyi di balik chip.
 */
export function hasActiveFilter(filters: WritingFilters) {
  return (
    filters.type !== "" ||
    filters.topicId !== "" ||
    filters.favoriteOnly ||
    filters.status !== "" ||
    filters.showArchived
  );
}

function matchesSearch(entry: JournalEntry, needle: string) {
  const q = needle.trim().toLowerCase();
  if (q === "") return true;
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    // Isi ikut dicari: sebuah puisi sering tidak punya judul yang menjelaskan
    // apa-apa, dan barisnya sendirilah yang diingat orang.
    entry.content.toLowerCase().includes(q)
  );
}

export function applyWritingFilters(entries: JournalEntry[], filters: WritingFilters) {
  return entries.filter((entry) => {
    if (entry.archived !== filters.showArchived) return false;
    if (filters.type !== "" && entry.type !== filters.type) return false;
    if (filters.topicId !== "" && !entry.topicIds.includes(filters.topicId)) return false;
    if (filters.favoriteOnly && !entry.favorite) return false;
    if (filters.status === "finished" && !entry.finished) return false;
    if (filters.status === "draft" && entry.finished) return false;
    return matchesSearch(entry, filters.search);
  });
}

export type TopicCount = { topic: Topic; count: number };

/**
 * Jumlah tulisan per topik — padanan kolom rollup "Counter" di Notion.
 *
 * Tulisan yang diarsipkan tidak ikut dihitung: angka ini dipakai untuk memilih
 * topik yang sedang aktif, dan topik yang isinya sudah disingkirkan semua tidak
 * lagi aktif.
 */
export function topicCounts(
  topics: Topic[],
  entries: JournalEntry[],
  /**
   * Ikutkan topik yang diarsipkan. Baris penyaring tidak memerlukannya, tapi
   * layar kelola topik harus menampilkannya — kalau tidak, topik yang sudah
   * diarsipkan tidak akan pernah bisa dikeluarkan lagi dari arsip.
   */
  includeArchived = false
): TopicCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.archived) continue;
    for (const id of entry.topicIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return topics
    .filter((topic) => includeArchived || !topic.archived)
    .map((topic) => ({ topic, count: counts.get(topic.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name));
}

export type TypeCount = { type: WritingType; count: number };

export function typeCounts(entries: JournalEntry[], types: readonly WritingType[]): TypeCount[] {
  const counts = new Map<WritingType, number>();
  for (const entry of entries) {
    if (entry.archived) continue;
    counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
  }
  return types.map((type) => ({ type, count: counts.get(type) ?? 0 }));
}

/**
 * Id topik yang tidak lagi punya topiknya — sisa dari topik yang dihapus.
 *
 * Firestore tidak punya foreign key, jadi menghapus sebuah topik meninggalkan
 * id yatim di dalam tulisan. Dibiarkan begitu, id itu tidak cocok dengan
 * penyaring mana pun dan tulisannya tampak tidak bertopik padahal datanya masih
 * menyimpan sesuatu.
 */
export function orphanTopicIds(entries: JournalEntry[], topics: Topic[]) {
  const known = new Set(topics.map((topic) => topic.id));
  const orphans = new Set<string>();
  for (const entry of entries) {
    for (const id of entry.topicIds) {
      if (!known.has(id)) orphans.add(id);
    }
  }
  return [...orphans];
}
