import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Root-level collection, not under users/{uid} — visitors filling this out
 * are not signed in yet. See firestore.rules: create-only, no auth required,
 * every field validated server-side, and read/update/delete are blocked
 * entirely so nobody can scrape or tamper with the list from the client.
 */
const MAX_NAME = 100;
const MAX_USE_CASE = 500;
const MAX_EMAIL = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistEntry = {
  email: string;
  name?: string;
  useCase?: string;
  /** Honeypot field — real visitors never fill this in. Non-empty means bot. */
  website?: string;
};

export function isValidWaitlistEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_EMAIL && EMAIL_RE.test(trimmed);
}

export async function joinWaitlist(entry: WaitlistEntry): Promise<void> {
  // Silently "succeed" for bots without writing anything — tipping them off
  // that the honeypot was detected only teaches them to leave it blank too.
  if (entry.website && entry.website.trim() !== "") return;

  const email = entry.email.trim().toLowerCase();
  if (!isValidWaitlistEmail(email)) throw new Error("waitlist.invalidEmail");

  const payload: Record<string, unknown> = {
    email,
    createdAt: serverTimestamp(),
  };
  const name = entry.name?.trim();
  if (name) payload.name = name.slice(0, MAX_NAME);
  const useCase = entry.useCase?.trim();
  if (useCase) payload.useCase = useCase.slice(0, MAX_USE_CASE);

  await addDoc(collection(db, "waitlist"), payload);
}
