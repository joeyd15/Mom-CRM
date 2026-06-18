"use client";

import { GitBranch } from "lucide-react";
import { suggestCampaignSelection } from "@/lib/campaignSelector";
import type { CampaignFormValues } from "@/lib/types";

interface CampaignSelectorPanelProps {
  values: CampaignFormValues;
}

export default function CampaignSelectorPanel({ values }: CampaignSelectorPanelProps) {
  const suggestion = suggestCampaignSelection(values);

  return (
    <section className="mt-5 rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <GitBranch className="mt-0.5 h-5 w-5 flex-none text-evergreen" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-ink">Campaign Selection Preview</h3>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            Rule-based placeholder for future automatic campaign selection.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm">
        <InfoLine label="Template" value={suggestion.templateName} />
        <InfoLine label="Priority" value={suggestion.priority} />
        <InfoLine label="Suggested stage" value={suggestion.recommendedStage} />
        <InfoLine label="Confidence" value={`${Math.round(suggestion.confidence * 100)}%`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestion.suggestedTags.map((tag) => (
          <span key={tag} className="rounded bg-mist px-2 py-1 text-xs font-medium text-ink/70">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-ink/60">{suggestion.reasons[0]}</p>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-mist/55 px-3 py-2">
      <span className="text-xs font-semibold uppercase text-ink/50">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
