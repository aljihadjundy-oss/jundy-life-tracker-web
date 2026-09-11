/**
 * The five modules the app is built from. Each one can be switched off, so the
 * nav, the home screen and the router all read from this list rather than
 * hard-coding their own.
 */
export type PillarKey = "finance" | "time" | "branding" | "health" | "journal";

export const PILLAR_KEYS: PillarKey[] = ["finance", "time", "branding", "health", "journal"];

export const PILLAR_ROUTES: Record<PillarKey, string> = {
  finance: "/keuangan",
  time: "/waktu",
  branding: "/branding",
  health: "/kesehatan",
  journal: "/jurnal",
};

export const PILLAR_EMOJI: Record<PillarKey, string> = {
  finance: "💰",
  time: "🗓️",
  branding: "✨",
  health: "❤️",
  journal: "📝",
};

export type Pillars = Record<PillarKey, boolean>;

export const ALL_PILLARS_ON: Pillars = {
  finance: true,
  time: true,
  branding: true,
  health: true,
  journal: true,
};

export function enabledPillars(pillars: Pillars): PillarKey[] {
  return PILLAR_KEYS.filter((key) => pillars[key]);
}

/** Which pillar a path belongs to, or null for shared pages. */
export function pillarForPath(pathname: string): PillarKey | null {
  const entry = Object.entries(PILLAR_ROUTES).find(([, route]) => pathname.startsWith(route));
  return entry ? (entry[0] as PillarKey) : null;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * Asked once, at sign-up. It exists to shape the app — a cycle tracker has no
 * business appearing for someone who does not have a cycle — so it is kept to
 * the few fields that actually change what gets rendered.
 */
export type Gender = "unset" | "male" | "female" | "other";

export const GENDERS: Gender[] = ["male", "female", "other"];

export type Profile = {
  displayName: string;
  gender: Gender;
  /** ISO date, "" when skipped. Used only to show age. */
  birthDate: string;
  occupation: string;
  /** Null until onboarding is finished; that is what gates the flow. */
  onboardedAt: number | null;
};

export const EMPTY_PROFILE: Profile = {
  displayName: "",
  gender: "unset",
  birthDate: "",
  occupation: "",
  onboardedAt: null,
};

/**
 * Whether the Kesehatan module should offer cycle, pregnancy and breastfeeding
 * tracking. Defaulted from gender but stored separately in health settings so
 * it stays overridable — plenty of people don't fit the default either way.
 */
export function cycleRelevantByDefault(profile: Profile) {
  return profile.gender === "female";
}

export function ageFrom(birthDate: string, now = new Date()) {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
