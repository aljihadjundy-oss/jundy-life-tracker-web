import { todayISO } from "./format";
import {
  DEFAULT_DURATION_MINUTES,
  type NewTask,
  type TaskCategory,
  type TaskSource,
} from "@/types/waktu";

/**
 * Turns pasted meeting notes into tasks, locally.
 *
 * The original tracker sent the text to the Anthropic API straight from the
 * browser — that only works inside Claude's artifact sandbox, where the call is
 * proxied. A deployed static site would have to ship an API key in the bundle,
 * so this parser is deterministic instead: it strips bullets and numbering,
 * understands the inline tags below, and also reads the "PIC:" / "deadline:"
 * shorthand people already type in Indonesian minutes.
 *
 *   Kirim proposal ke klien @Tara #Sinatif Agency ^2026-10-02 !delegasi
 *   2. Follow up vendor — PIC: Naufal, deadline 3 Okt
 */

export type ParsedTask = {
  title: string;
  owner: string;
  unit: string;
  dueDate: string;
  category: TaskCategory;
  note: string;
};

const CATEGORY_WORDS: Record<string, TaskCategory> = {
  personal: "personal",
  pribadi: "personal",
  delegasi: "delegation",
  delegation: "delegation",
  crossbu: "crossbu",
  "cross-bu": "crossbu",
  lintas: "crossbu",
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7,
  agu: 8, aug: 8, ags: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12,
};

/**
 * Headings and roll-call lines, which show up in every set of minutes and are
 * never action items. Matched on the opening word so "Notulensi Rapat Mingguan"
 * is dropped along with a bare "Notulensi:".
 */
const SKIP = /^(notulen|notulensi|agenda|peserta|hadir|absen|action items?|tindak lanjut|to ?do list?)\b/i;

function stripBullet(line: string) {
  return line
    .replace(/^\s*[-*•·–—]\s+/, "")
    .replace(/^\s*\(?\d+[.)]\s+/, "")
    .replace(/^\s*\[[ xX]\]\s*/, "")
    .trim();
}

/** Accepts 2026-10-02, 2/10/2026, 2-10-26, "3 Okt", "3 Oktober 2026". */
export function parseLooseDate(raw: string, today = todayISO()): string {
  const text = raw.trim();

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;

  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : Number(today.slice(0, 4));
    if (year < 100) year += 2000;
    return format(year, month, day);
  }

  const named = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s*(\d{4})?$/);
  if (named) {
    const month = MONTHS[named[2].slice(0, 3).toLowerCase()];
    if (!month) return "";
    const day = Number(named[1]);
    let year = named[3] ? Number(named[3]) : Number(today.slice(0, 4));
    // A bare "3 Jan" written in December means next January, not last.
    const candidate = format(year, month, day);
    if (!named[3] && candidate < today) year += 1;
    return format(year, month, day);
  }

  return "";
}

/** Collapses runs of spaces and trims the punctuation left behind by a tag. */
function tidy(text: string) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:.\-–—]+/, "")
    .replace(/[\s,;:.\-–—]+$/, "")
    .trim();
}

function format(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * `units` is used to match a `#tag` against a real business unit so a name with
 * spaces ("#Sinatif Agency") still resolves without needing quotes.
 */
export function parseTaskLines(text: string, units: string[], today = todayISO()): ParsedTask[] {
  const out: ParsedTask[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    let line = stripBullet(rawLine);
    if (!line || SKIP.test(line)) continue;

    let owner = "";
    let unit = "";
    let dueDate = "";
    let category: TaskCategory | "" = "";
    let note = "";

    // #unit — longest matching known unit first, so "#Sinatif Academy" doesn't
    // resolve to "Sinatif Agency" on a prefix.
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);
    for (const candidate of sortedUnits) {
      const tag = `#${candidate}`;
      const at = line.toLowerCase().indexOf(tag.toLowerCase());
      if (at !== -1) {
        unit = candidate;
        line = (line.slice(0, at) + line.slice(at + tag.length)).trim();
        break;
      }
    }

    line = line.replace(/\^(\S+)/, (_, value: string) => {
      dueDate = parseLooseDate(value, today);
      return "";
    });

    line = line.replace(/!([A-Za-z-]+)/, (match, word: string) => {
      const mapped = CATEGORY_WORDS[word.toLowerCase()];
      if (!mapped) return match;
      category = mapped;
      return "";
    });

    line = line.replace(/@([\p{L}][\p{L}.'-]*(?:\s+[\p{L}][\p{L}.'-]*)?)/u, (_, name: string) => {
      owner = name.trim();
      return "";
    });

    // "PIC: Nama" / "Owner: Nama" / "penanggung jawab: Nama"
    line = line.replace(
      /\b(?:pic|owner|penanggung\s*jawab)\s*:?\s*([\p{L}][\p{L}.'-]*(?:\s+[\p{L}][\p{L}.'-]*)?)/iu,
      (_, name: string) => {
        if (!owner) owner = name.trim();
        return "";
      }
    );

    // "deadline 3 Okt" / "due: 2026-10-02" / "tenggat 2/10"
    line = line.replace(
      /\b(?:deadline|due|tenggat|dl)\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3,}\.?(?:\s+\d{4})?)/i,
      (match, value: string) => {
        const parsed = parseLooseDate(value, today);
        if (!parsed) return match;
        if (!dueDate) dueDate = parsed;
        return "";
      }
    );

    // Whatever follows an em dash or " - " reads as a note, not the task.
    const split = line.match(/^(.*?)\s+[—–]\s+(.*)$/);
    if (split) {
      line = split[1];
      note = split[2];
    }

    const title = tidy(line);
    if (!title) continue;

    out.push({
      title,
      owner,
      unit,
      dueDate: dueDate || today,
      // An owner that isn't you is a delegation unless the line says otherwise.
      category: category || (owner ? "delegation" : "personal"),
      note: tidy(note),
    });
  }

  return out;
}

export function toNewTasks(parsed: ParsedTask[], source: TaskSource): NewTask[] {
  return parsed.map((item) => ({
    title: item.title,
    note: item.note,
    dueDate: item.dueDate,
    startTime: "",
    durationMinutes: DEFAULT_DURATION_MINUTES,
    reminderMinutes: 0,
    status: "todo",
    category: item.category,
    owner: item.owner,
    unit: item.unit,
    link: "",
    source,
  }));
}
