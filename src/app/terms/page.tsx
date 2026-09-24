"use client";

import LegalPage from "@/components/LegalPage";

const SECTION_KEYS = [
  "acceptance",
  "serviceDescription",
  "betaStatus",
  "pricing",
  "accountAccess",
  "userContent",
  "acceptableUse",
  "termination",
  "liability",
  "legalRef",
  "changes",
];

export default function TermsPage() {
  return <LegalPage titleKey="terms.title" sectionPrefix="terms" sectionKeys={SECTION_KEYS} />;
}
