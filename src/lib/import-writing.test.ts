import assert from "node:assert/strict";
import { test } from "vitest";
import { parseTopicCell, parseTopicsCsv, parseWritingCsv } from "./import-writing";

const TOPICS_CSV = `Name,Archive,Counter,Created,Edited,Favorite,Notes
Philosophy,No,14 Notes,"September 9, 2026 4:00 PM","September 9, 2026 4:00 PM",No,"a, b"
Personal Development,No,0 Notes,"September 9, 2026 4:00 PM","September 9, 2026 4:00 PM",No,
Social Media & Digital Skills,No,1 Note,"September 9, 2026 4:00 PM","September 9, 2026 4:00 PM",No,x
`;

// Dipotong dari ekspor sungguhan, termasuk baris tanpa judul dan sel Topics
// bergaya Notion yang menempelkan tautan berkas di belakang namanya.
const WRITING_CSV = `Name,Archive,Created,Description,Edited,Favorite,Finished,Place,Related Notes,Topics,Type
"better this way, right?",No,"September 9, 2026 4:00 PM",,"September 9, 2026 4:00 PM",Yes,Yes,,,Philosophy (Philosophy%20018e35f20f3e82fca1a0811f48484574.md),Poetry
Larangan AI di kampus? Itu malah nggak ngefek.,No,"September 9, 2026 4:00 PM",,"September 9, 2026 4:00 PM",No,No,,,Technology (Technology%2078ae35f20f3e837c929a81546ac14089.md),Script
Confirmation Bias: Efek Samping dari Algoritma Media Sosial,No,"September 9, 2026 4:00 PM",Artikel ini mengulas algoritma.,"September 9, 2026 4:00 PM",No,Yes,,,Social Media & Digital Skills (Social%20Media%20&%20Digital%20Skills%20d70e35f20f3e826baff4018b2dc676eb.md),Article
tolol banget si jundy,Yes,"September 9, 2026 4:00 PM",,"September 9, 2026 4:00 PM",No,No,,,,Unspoken
,No,"September 9, 2026 4:00 PM",,"September 9, 2026 4:00 PM",No,No,,,,Poetry
`;

test("membaca nama topik dari ekspor Topics", () => {
  assert.deepEqual(parseTopicsCsv(TOPICS_CSV), [
    "Philosophy",
    "Personal Development",
    "Social Media & Digital Skills",
  ]);
});

test("sel Topics: nama diambil, tautan berkasnya dibuang", () => {
  assert.deepEqual(
    parseTopicCell("Philosophy (Philosophy%20018e35f20f3e82fca1a0811f48484574.md)"),
    ["Philosophy"]
  );
});

test("sel Topics dengan lebih dari satu topik", () => {
  assert.deepEqual(
    parseTopicCell(
      "Philosophy (Philosophy%20018e.md), Politics (Politics%20a60e.md)"
    ),
    ["Philosophy", "Politics"]
  );
});

test("nama topik bertanda '&' tidak terpotong", () => {
  // Nama ini ada sungguhan di template-nya dan jadi ujian terbaik bahwa
  // pemisahnya bukan sekadar koma.
  assert.deepEqual(
    parseTopicCell("Social Media & Digital Skills (Social%20Media%20&%20Digital%20Skills%20d70e.md)"),
    ["Social Media & Digital Skills"]
  );
});

test("sel Topics kosong menghasilkan daftar kosong", () => {
  assert.deepEqual(parseTopicCell(""), []);
  assert.deepEqual(parseTopicCell("   "), []);
});

test("jenis Notion dipetakan ke jenis tulisan di sini", () => {
  const { rows } = parseWritingCsv(WRITING_CSV, []);
  assert.deepEqual(rows.map((r) => r.entry.type), ["poetry", "script", "article", "unspoken"]);
});

test("baris tanpa judul dilewati dan dihitung", () => {
  const { rows, skipped } = parseWritingCsv(WRITING_CSV, []);
  assert.equal(rows.length, 4);
  assert.equal(skipped, 1);
});

test("penanda Yes/No jadi boolean", () => {
  const { rows } = parseWritingCsv(WRITING_CSV, []);
  const puisi = rows[0].entry;
  assert.equal(puisi.favorite, true);
  assert.equal(puisi.finished, true);
  assert.equal(puisi.archived, false);

  const unspoken = rows[3].entry;
  assert.equal(unspoken.favorite, false);
  assert.equal(unspoken.archived, true, "kolom Archive ikut terbaca");
});

test("ringkasan ikut terbawa", () => {
  const { rows } = parseWritingCsv(WRITING_CSV, []);
  assert.equal(rows[2].entry.description, "Artikel ini mengulas algoritma.");
});

test("judul berisi koma tidak terpecah", () => {
  const { rows } = parseWritingCsv(WRITING_CSV, []);
  assert.equal(rows[0].entry.title, "better this way, right?");
});

test("topik yang belum ada di aplikasi dilaporkan", () => {
  const { unknownTopics } = parseWritingCsv(WRITING_CSV, ["Philosophy"]);
  assert.deepEqual(unknownTopics.sort(), ["Social Media & Digital Skills", "Technology"]);
});

test("topik yang sudah ada tidak dilaporkan sebagai baru, apa pun besar-kecilnya", () => {
  const { unknownTopics } = parseWritingCsv(WRITING_CSV, [
    "philosophy",
    "TECHNOLOGY",
    "Social Media & Digital Skills",
  ]);
  assert.deepEqual(unknownTopics, []);
});

test("isi tulisan selalu kosong — ekspor CSV Notion memang tidak memuatnya", () => {
  const { rows } = parseWritingCsv(WRITING_CSV, []);
  assert.deepEqual([...new Set(rows.map((r) => r.entry.content))], [""]);
});

test("berkas kosong atau hanya header tidak meledak", () => {
  assert.deepEqual(parseWritingCsv("", []).rows, []);
  assert.deepEqual(parseWritingCsv("Name,Type\n", []).rows, []);
  assert.deepEqual(parseTopicsCsv(""), []);
});

test("berkas tanpa kolom Name menghasilkan nol baris, bukan sampah", () => {
  assert.deepEqual(parseTopicsCsv("Judul,Type\nHalo,Poetry\n"), []);
});
