import assert from "node:assert/strict";
import { test } from "vitest";
import { WRITING_TYPES, type JournalEntry, type Topic } from "@/types/journal";
import {
  applyWritingFilters,
  EMPTY_FILTERS,
  hasActiveFilter,
  orphanTopicIds,
  topicCounts,
  typeCounts,
  type WritingFilters,
} from "./writing";

function entry(patch: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "e1",
    title: "Tanpa judul",
    content: "",
    mood: "",
    date: "2026-09-11",
    hasAudio: false,
    audioSeconds: 0,
    type: "journal",
    topicIds: [],
    description: "",
    favorite: false,
    finished: false,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

function topic(patch: Partial<Topic> = {}): Topic {
  return { id: "t1", name: "Philosophy", archived: false, createdAt: 0, ...patch };
}

function filters(patch: Partial<WritingFilters> = {}): WritingFilters {
  return { ...EMPTY_FILTERS, ...patch };
}

// ---------------------------------------------------------------------------
// Arsip
// ---------------------------------------------------------------------------

test("arsip disembunyikan kecuali diminta", () => {
  const rows = [entry({ id: "a", archived: false }), entry({ id: "b", archived: true })];
  assert.deepEqual(applyWritingFilters(rows, filters()).map((e) => e.id), ["a"]);
});

test("saat arsip diminta, HANYA arsip yang tampil", () => {
  // Bukan "arsip ditambahkan ke daftar biasa": itu membuat tombolnya tidak
  // berguna, karena yang dicari justru yang sudah disingkirkan.
  const rows = [entry({ id: "a", archived: false }), entry({ id: "b", archived: true })];
  assert.deepEqual(
    applyWritingFilters(rows, filters({ showArchived: true })).map((e) => e.id),
    ["b"]
  );
});

// ---------------------------------------------------------------------------
// Penyaring
// ---------------------------------------------------------------------------

test("saring menurut jenis", () => {
  const rows = [
    entry({ id: "a", type: "poetry" }),
    entry({ id: "b", type: "article" }),
    entry({ id: "c", type: "poetry" }),
  ];
  assert.deepEqual(
    applyWritingFilters(rows, filters({ type: "poetry" })).map((e) => e.id),
    ["a", "c"]
  );
});

test("saring menurut topik, termasuk tulisan bertopik ganda", () => {
  const rows = [
    entry({ id: "a", topicIds: ["t1"] }),
    entry({ id: "b", topicIds: ["t2", "t1"] }),
    entry({ id: "c", topicIds: ["t2"] }),
    entry({ id: "d", topicIds: [] }),
  ];
  assert.deepEqual(
    applyWritingFilters(rows, filters({ topicId: "t1" })).map((e) => e.id),
    ["a", "b"]
  );
});

test("status memisahkan selesai dari draf", () => {
  const rows = [entry({ id: "a", finished: true }), entry({ id: "b", finished: false })];
  assert.deepEqual(applyWritingFilters(rows, filters({ status: "finished" })).map((e) => e.id), ["a"]);
  assert.deepEqual(applyWritingFilters(rows, filters({ status: "draft" })).map((e) => e.id), ["b"]);
  assert.equal(applyWritingFilters(rows, filters({ status: "" })).length, 2);
});

test("favorit saja", () => {
  const rows = [entry({ id: "a", favorite: true }), entry({ id: "b" })];
  assert.deepEqual(applyWritingFilters(rows, filters({ favoriteOnly: true })).map((e) => e.id), ["a"]);
});

test("pencarian menjangkau judul, ringkasan, dan isi", () => {
  const rows = [
    entry({ id: "judul", title: "Aku Punya Waktu" }),
    entry({ id: "ringkasan", description: "tentang waktu yang habis" }),
    entry({ id: "isi", content: "hari itu waktu berhenti" }),
    entry({ id: "lain", title: "Imperfection" }),
  ];
  assert.deepEqual(
    applyWritingFilters(rows, filters({ search: "waktu" })).map((e) => e.id),
    ["judul", "ringkasan", "isi"]
  );
});

test("pencarian tidak peduli huruf besar-kecil dan spasi di tepi", () => {
  const rows = [entry({ id: "a", title: "Imperfection" })];
  assert.equal(applyWritingFilters(rows, filters({ search: "  IMPERF " })).length, 1);
});

test("penyaring digabung, bukan dipilih salah satu", () => {
  const rows = [
    entry({ id: "a", type: "poetry", topicIds: ["t1"], favorite: true }),
    entry({ id: "b", type: "poetry", topicIds: ["t1"], favorite: false }),
    entry({ id: "c", type: "article", topicIds: ["t1"], favorite: true }),
  ];
  assert.deepEqual(
    applyWritingFilters(rows, filters({ type: "poetry", topicId: "t1", favoriteOnly: true })).map(
      (e) => e.id
    ),
    ["a"]
  );
});

test("hasActiveFilter mengabaikan pencarian", () => {
  assert.equal(hasActiveFilter(filters({ search: "apa pun" })), false);
  assert.equal(hasActiveFilter(filters({ type: "poetry" })), true);
  assert.equal(hasActiveFilter(filters({ showArchived: true })), true);
  assert.equal(hasActiveFilter(filters()), false);
});

// ---------------------------------------------------------------------------
// Hitungan
// ---------------------------------------------------------------------------

test("topicCounts menghitung per topik dan mengurutkan dari terbanyak", () => {
  const topics = [topic({ id: "t1", name: "Philosophy" }), topic({ id: "t2", name: "Technology" })];
  const rows = [
    entry({ id: "a", topicIds: ["t1"] }),
    entry({ id: "b", topicIds: ["t1", "t2"] }),
    entry({ id: "c", topicIds: ["t1"] }),
  ];
  assert.deepEqual(
    topicCounts(topics, rows).map((r) => [r.topic.name, r.count]),
    [
      ["Philosophy", 3],
      ["Technology", 1],
    ]
  );
});

test("topik tanpa tulisan tetap muncul dengan angka nol", () => {
  // Seperti di Notion: topik kosong tetap terlihat supaya bisa dipilih untuk
  // tulisan berikutnya, bukan hilang sampai ada isinya.
  const counts = topicCounts([topic({ id: "t9", name: "Business" })], []);
  assert.deepEqual(counts.map((r) => [r.topic.name, r.count]), [["Business", 0]]);
});

test("tulisan terarsip tidak ikut dihitung", () => {
  const topics = [topic({ id: "t1" })];
  const rows = [entry({ id: "a", topicIds: ["t1"] }), entry({ id: "b", topicIds: ["t1"], archived: true })];
  assert.equal(topicCounts(topics, rows)[0].count, 1);
});

test("topik terarsip tidak ikut ditampilkan", () => {
  const topics = [topic({ id: "t1" }), topic({ id: "t2", name: "Lama", archived: true })];
  assert.deepEqual(topicCounts(topics, []).map((r) => r.topic.id), ["t1"]);
});

test("kelola topik tetap melihat topik terarsip", () => {
  // Tanpa ini, topik yang sudah diarsipkan tidak akan pernah bisa dikeluarkan
  // lagi dari arsip, karena layar pengelolanya tidak menampilkannya.
  const topics = [topic({ id: "t1" }), topic({ id: "t2", name: "Lama", archived: true })];
  assert.deepEqual(topicCounts(topics, [], true).map((r) => r.topic.id).sort(), ["t1", "t2"]);
});

test("topik dengan jumlah sama diurutkan menurut abjad", () => {
  const topics = [topic({ id: "t2", name: "Zeta" }), topic({ id: "t1", name: "Alpha" })];
  assert.deepEqual(topicCounts(topics, []).map((r) => r.topic.name), ["Alpha", "Zeta"]);
});

test("typeCounts mengembalikan semua jenis, termasuk yang kosong", () => {
  const rows = [entry({ type: "poetry" }), entry({ type: "poetry" }), entry({ type: "article" })];
  const counts = typeCounts(rows, WRITING_TYPES);
  assert.equal(counts.length, WRITING_TYPES.length);
  assert.equal(counts.find((c) => c.type === "poetry")?.count, 2);
  assert.equal(counts.find((c) => c.type === "article")?.count, 1);
  assert.equal(counts.find((c) => c.type === "unspoken")?.count, 0);
});

// ---------------------------------------------------------------------------
// Id yatim
// ---------------------------------------------------------------------------

test("id topik yang topiknya sudah dihapus terdeteksi", () => {
  const rows = [entry({ topicIds: ["t1", "hantu"] }), entry({ topicIds: ["hantu"] })];
  assert.deepEqual(orphanTopicIds(rows, [topic({ id: "t1" })]), ["hantu"]);
});

test("tanpa yatim, hasilnya kosong", () => {
  assert.deepEqual(orphanTopicIds([entry({ topicIds: ["t1"] })], [topic({ id: "t1" })]), []);
});
