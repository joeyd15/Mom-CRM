"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { scanCampaignCompliance } from "@/lib/compliance";
import type { GeneratedCampaign } from "@/lib/types";

interface ComplianceReportProps {
  campaign: GeneratedCampaign;
}

export default function ComplianceReport({ campaign }: ComplianceReportProps) {
  const issues = scanCampaignCompliance(campaign);
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        {warningCount > 0 ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-coral" aria-hidden />
        ) : (
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-evergreen" aria-hidden />
        )}
        <div>
          <h2 className="text-sm font-semibold text-ink">Local Review Scan</h2>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            Deterministic scan for obvious guarantee language, spam pressure, and long SMS drafts.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {issues.slice(0, 8).map((issue, index) => (
          <div
            key={`${issue.location}-${index}`}
            className={`rounded-md border p-3 text-sm ${
              issue.severity === "warning"
                ? "border-coral/25 bg-coral/10 text-ink/80"
                : "border-evergreen/20 bg-mist text-ink/75"
            }`}
          >
            <p className="font-semibold text-ink">{issue.location}</p>
            <p className="mt-1 leading-6">{issue.message}</p>
            {issue.excerpt ? <p className="mt-1 text-xs italic text-ink/60">{issue.excerpt}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
