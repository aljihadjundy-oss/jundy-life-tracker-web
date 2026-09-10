import type { AwardResult } from "./gamification";

export type Celebration =
  | { kind: "xp"; xp: number }
  | { kind: "goal"; xp: number }
  | { kind: "level"; level: number }
  | { kind: "badge"; badgeId: string };

type Listener = (c: Celebration) => void;

const listeners = new Set<Listener>();

export function onCelebrate(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(c: Celebration) {
  listeners.forEach((l) => l(c));
}

/**
 * Turns an award into the celebrations worth showing, biggest last so the
 * level-up / badge overlay lands after the small XP pop.
 */
export function celebrate(result: AwardResult) {
  emit(result.goalJustReached ? { kind: "goal", xp: result.xpGained } : { kind: "xp", xp: result.xpGained });
  if (result.leveledUpTo !== null) emit({ kind: "level", level: result.leveledUpTo });
  for (const badgeId of result.newBadges) emit({ kind: "badge", badgeId });
}
