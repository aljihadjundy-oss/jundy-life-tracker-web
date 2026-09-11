"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { subscribePillars, subscribeProfile } from "./profile";
import { ALL_PILLARS_ON, EMPTY_PROFILE, type Pillars, type Profile } from "@/types/profile";

type UserConfig = {
  profile: Profile;
  pillars: Pillars;
  /** False until both documents have arrived at least once. */
  ready: boolean;
};

const Ctx = createContext<UserConfig>({
  profile: EMPTY_PROFILE,
  pillars: ALL_PILLARS_ON,
  ready: false,
});

/**
 * Profile and pillar settings, subscribed once and shared. The nav, the home
 * screen and the health module all branch on these, so a per-component
 * subscription would mean four listeners for the same two documents.
 */
export function UserConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [pillars, setPillars] = useState<Pillars>(ALL_PILLARS_ON);
  const [loaded, setLoaded] = useState({ profile: false, pillars: false });

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeProfile(user.uid, (next) => {
      setProfile(next);
      setLoaded((prev) => (prev.profile ? prev : { ...prev, profile: true }));
    });
    const unsubPillars = subscribePillars(user.uid, (next) => {
      setPillars(next);
      setLoaded((prev) => (prev.pillars ? prev : { ...prev, pillars: true }));
    });
    return () => {
      unsubProfile();
      unsubPillars();
    };
  }, [user]);

  return (
    <Ctx.Provider value={{ profile, pillars, ready: loaded.profile && loaded.pillars }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserConfig() {
  return useContext(Ctx);
}
