import type { EvidenceResponse } from "@/lib/api/types";

export function EvidenceList({ evidences }: { evidences: EvidenceResponse[] }) {
  if (evidences.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 space-y-1 border-l-2 border-background-selected pl-3 text-xs text-text-secondary">
      {evidences.map((evidence) => (
        <li key={evidence.id}>
          <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {evidence.title} · {evidence.sourceOrg}
          </a>
        </li>
      ))}
    </ul>
  );
}
