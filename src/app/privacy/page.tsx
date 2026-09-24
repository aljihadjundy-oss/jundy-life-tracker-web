"use client";

import LegalPage from "@/components/LegalPage";

const SECTION_KEYS = [
  "intro",
  "dataCollected",
  "whereStored",
  "thirdParties",
  "retention",
  "yourRights",
  "security",
  "children",
  "changes",
  "legalRef",
];

export default function PrivacyPage() {
  return <LegalPage titleKey="privacy.title" sectionPrefix="privacy" sectionKeys={SECTION_KEYS} />;
}
