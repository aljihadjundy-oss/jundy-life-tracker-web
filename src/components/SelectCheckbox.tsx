"use client";

/** The round tick every list row shows while selection mode is on. */
export default function SelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
        checked ? "border-accent-time bg-accent-time text-white" : "border-border text-transparent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
