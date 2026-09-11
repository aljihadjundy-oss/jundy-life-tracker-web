/**
 * Joins class names, dropping falsy values. The shadcn `cn` normally wraps
 * clsx + tailwind-merge; this project has neither, and nothing here relies on
 * conflicting-class resolution, so a dependency-free join is enough.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
