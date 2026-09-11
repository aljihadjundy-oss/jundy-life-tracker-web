import { doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import {
  ALL_PILLARS_ON,
  EMPTY_PROFILE,
  PILLAR_KEYS,
  type Pillars,
  type Profile,
} from "@/types/profile";

function profileRef(uid: string) {
  return doc(db, "users", uid, "settings", "profile");
}

function pillarsRef(uid: string) {
  return doc(db, "users", uid, "settings", "pillars");
}

export function subscribeProfile(uid: string, onData: (profile: Profile) => void) {
  return onSnapshot(profileRef(uid), (snap) => {
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    const stamp: unknown = data.onboardedAt;
    onData({
      displayName: (data.displayName as string) ?? EMPTY_PROFILE.displayName,
      gender: (data.gender as Profile["gender"]) ?? EMPTY_PROFILE.gender,
      birthDate: (data.birthDate as string) ?? EMPTY_PROFILE.birthDate,
      occupation: (data.occupation as string) ?? EMPTY_PROFILE.occupation,
      onboardedAt:
        stamp instanceof Timestamp ? stamp.toMillis() : typeof stamp === "number" ? stamp : null,
    });
  });
}

export async function saveProfile(uid: string, patch: Partial<Profile>) {
  await setDoc(profileRef(uid), patch, { merge: true });
}

export async function completeOnboarding(uid: string, profile: Partial<Profile>) {
  await setDoc(profileRef(uid), { ...profile, onboardedAt: serverTimestamp() }, { merge: true });
}

export function subscribePillars(uid: string, onData: (pillars: Pillars) => void) {
  return onSnapshot(pillarsRef(uid), (snap) => {
    const data = (snap.data() ?? {}) as Partial<Pillars>;
    // Anything not explicitly switched off stays on, so a new module added in a
    // later release appears rather than silently hiding.
    const pillars = { ...ALL_PILLARS_ON };
    for (const key of PILLAR_KEYS) {
      if (typeof data[key] === "boolean") pillars[key] = data[key];
    }
    onData(pillars);
  });
}

export async function setPillars(uid: string, pillars: Partial<Pillars>) {
  await setDoc(pillarsRef(uid), pillars, { merge: true });
}
