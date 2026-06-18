"use client";

import { Braces, Loader2 } from "lucide-react";
import { useState } from "react";
import type { CampaignFormValues, GeneratedCampaign } from "@/lib/types";
import CopyButton from "./CopyButton";

interface MaxTechPreviewButtonProps {
  values: CampaignFormValues;
  campaign: GeneratedCampaign;
}

export default function MaxTechPreviewButton({ values, campaign }: MaxTechPreviewButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function createPreview() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/maxtech/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values, campaign })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to build MAXTech/BoldTrail preview.");
      }

      setPreview(JSON.stringify(data, null, 2));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to build preview.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">MAXTech/BoldTrail Draft Preview</h2>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            Converts this campaign into the local placeholder CRM campaign shape. No CRM call is made.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createPreview}
            disabled={isLoading}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-ink/15 bg-mist px-3 text-sm font-medium text-ink transition hover:border-evergreen hover:text-evergreen disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Braces className="h-4 w-4" aria-hidden />}
            <span>Build preview</span>
          </button>
          {preview ? <CopyButton text={preview} label="Copy preview" /> : null}
        </div>
      </div>
      {error ? <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm text-ink/75">{error}</p> : null}
      {preview ? (
        <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-ink p-4 text-xs leading-5 text-white">
          <code>{preview}</code>
        </pre>
      ) : null}
    </div>
  );
}
