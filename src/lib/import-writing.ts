import { parseCsv } from "./csv";
import { EMPTY_WRITING_FIELDS, WRITING_TYPES, type NewJournalEntry, type WritingType } from "@/types/journal";

/**
 * Membaca ekspor CSV dari basis data Writing milik Notion.
 *
 * Notion mengekspor kolom relasi sebagai teks, bukan id: satu sel Topics
 * berbunyi `Philosophy (Philosophy%20018e...md)` — nama topik diikuti tautan
 * berkasnya. Jadi yang dicocokkan di sini adalah NAMANYA, lalu dipetakan ke
 * topik yang sudah ada di aplikasi. Itu juga sebabnya topik bawaan memakai
 * nama yang sama persis dengan di Notion.
 *
 * Isi tulisannya TIDAK ada di berkas ini. Notion menaruh badan setiap halaman
 * di berkas terpisah, satu per halaman, dan ekspor CSV basis data hanya
 * memuat propertinya. Jadi yang masuk adalah judul, jenis, topik, ringkasan,
 * dan penandanya — isinya menyusul saat ditempel sendiri.
 */

/** Nilai kolom Type di Notion → jenis tulisan di sini. */
const TYPE_BY_LABEL: Record<string, WritingType> = {
  poetry: "poetry",
  script: "script",
  article: "article",
  unspoken: "unspoken",
  journal: "journal",
  note: "journal",
};

export type WritingImportRow = {
  entry: NewJournalEntry;
  /** Nama topik apa adanya dari berkas, untuk dicocokkan oleh pemanggil. */
  topicNames: string[];
};

export type WritingImportResult = {
  rows: WritingImportRow[];
  /** Nama topik pada berkas yang belum ada di aplikasi. */
  unknownTopics: string[];
  /** Baris yang dilewati karena tidak punya judul sama sekali. */
  skipped: number;
};

function yes(value: string | undefined) {
  return (value ?? "").trim().toLowerCase() === "yes";
}

/**
 * `Philosophy (Philosophy%20018e...md), Politics (Politics%20a60e...md)`
 * → ["Philosophy", "Politics"]
 *
 * Dipisah di koma yang diikuti spasi lalu teks non-kurung, bukan koma apa pun:
 * nama topik boleh memuat koma, dan `Social Media & Digital Skills` sudah
 * membuktikan tanda baca di dalam nama itu nyata.
 */
export function parseTopicCell(cell: string): string[] {
  if (!cell.trim()) return [];
  return cell
    .split(/\.md\)\s*,\s*/)
    .map((part) => part.replace(/\s*\([^()]*\)?\s*$/, "").replace(/\.md\)$/, "").trim())
    .filter(Boolean);
}

export function parseWritingCsv(text: string, knownTopics: string[]): WritingImportResult {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], unknownTopics: [], skipped: 0 };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iName = col("name");
  const iType = col("type");
  const iDesc = col("description");
  const iTopics = col("topics");
  const iFavorite = col("favorite");
  const iFinished = col("finished");
  const iArchive = col("archive");

  const known = new Map(knownTopics.map((n) => [n.toLowerCase(), n]));
  const unknown = new Set<string>();
  const rows: WritingImportRow[] = [];
  let skipped = 0;

  // Tanggal diambil dari hari impor, bukan dari kolom Created di Notion:
  // seluruh 34 baris pada ekspor ini bertanggal sama — waktu ekspornya, bukan
  // waktu tulisannya dibuat. Menyalinnya akan terlihat presisi padahal palsu.
  const today = new Date().toISOString().slice(0, 10);

  for (const row of table.slice(1)) {
    const title = (iName >= 0 ? row[iName] : "")?.trim() ?? "";
    if (!title) {
      skipped += 1;
      continue;
    }

    const label = (iType >= 0 ? row[iType] : "")?.trim().toLowerCase() ?? "";
    const type = TYPE_BY_LABEL[label] ?? "journal";

    const topicNames = iTopics >= 0 ? parseTopicCell(row[iTopics] ?? "") : [];
    for (const name of topicNames) {
      if (!known.has(name.toLowerCase())) unknown.add(name);
    }

    rows.push({
      topicNames,
      entry: {
        ...EMPTY_WRITING_FIELDS,
        title,
        content: "",
        mood: "",
        date: today,
        hasAudio: false,
        audioSeconds: 0,
        type,
        topicIds: [],
        description: (iDesc >= 0 ? row[iDesc] : "")?.trim() ?? "",
        favorite: yes(iFavorite >= 0 ? row[iFavorite] : ""),
        finished: yes(iFinished >= 0 ? row[iFinished] : ""),
        archived: yes(iArchive >= 0 ? row[iArchive] : ""),
      },
    });
  }

  return { rows, unknownTopics: [...unknown], skipped };
}

/** Membaca ekspor basis data Topics — hanya nama yang diperlukan. */
export function parseTopicsCsv(text: string): string[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const iName = table[0].map((h) => h.trim().toLowerCase()).indexOf("name");
  if (iName < 0) return [];
  const names = table
    .slice(1)
    .map((row) => (row[iName] ?? "").trim())
    .filter(Boolean);
  return [...new Set(names)];
}

/** Jenis yang dikenali, untuk ditampilkan pada pratinjau impor. */
export const KNOWN_TYPE_LABELS = WRITING_TYPES;
