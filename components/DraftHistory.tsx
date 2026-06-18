"use client";

import { Clock, Trash2 } from "lucide-react";
import type { SavedCampaignDraft } from "@/lib/types";

interface DraftHistoryProps {
  drafts: SavedCampaignDraft[];
  onSelect: (draft: SavedCampaignDraft) => void;
  onClear: () => void;
}

export default function DraftHistory({ drafts, onSelect, onClear }: DraftHistoryProps) {
  if (!drafts.length) {
    return null;
  }

  return (
    <section className="mt-5 rounded-lg border border-ink/10 bg-mist/45 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock className="h-4 w-4 text-evergreen" aria-hidden />
          Recent Drafts
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-ink/15 bg-white px-2 text-xs font-medium text-ink transition hover:border-coral hover:text-coral"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            type="button"
            onClick={() => onSelect(draft)}
            className="block w-full rounded-md border border-ink/10 bg-white p-3 text-left transition hover:border-evergreen hover:shadow-sm"
          >
            <span className="block truncate text-sm font-semibold text-ink">
              {draft.values.leadFirstName || "Lead"} in {draft.values.cityMarket || "market"}
            </span>
            <span className="mt-1 block text-xs text-ink/60">
              {new Date(draft.createdAt).toLocaleString()} - {draft.values.campaignGoal} - {draft.mode}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
