"use client";

import { useEffect, useState } from "react";
import CampaignForm from "@/components/CampaignForm";
import CampaignSelectorPanel from "@/components/CampaignSelectorPanel";
import DraftHistory from "@/components/DraftHistory";
import GeneratedOutput from "@/components/GeneratedOutput";
import {
  initialCampaignFormValues,
  sampleCampaignFormValues
} from "@/lib/constants";
import type { CampaignFormValues, GenerateResponse, GeneratedCampaign, SavedCampaignDraft } from "@/lib/types";

const historyStorageKey = "real-estate-ai-campaign-history";

export default function Home() {
  const [values, setValues] = useState<CampaignFormValues>(initialCampaignFormValues);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);
  const [parsed, setParsed] = useState(true);
  const [mode, setMode] = useState<GenerateResponse["mode"] | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<SavedCampaignDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedDrafts = window.localStorage.getItem(historyStorageKey);
    if (!storedDrafts) {
      return;
    }

    try {
      setDrafts(JSON.parse(storedDrafts) as SavedCampaignDraft[]);
    } catch {
      window.localStorage.removeItem(historyStorageKey);
    }
  }, []);

  function persistDrafts(nextDrafts: SavedCampaignDraft[]) {
    setDrafts(nextDrafts);
    window.localStorage.setItem(historyStorageKey, JSON.stringify(nextDrafts));
  }

  async function generateCampaign() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json()) as GenerateResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate campaign.");
      }

      setCampaign(data.campaign);
      setParsed(data.parsed);
      setMode(data.mode);
      setNotice(data.notice || null);
      setRawText(data.rawText);

      const nextDraft: SavedCampaignDraft = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        values,
        campaign: data.campaign,
        parsed: data.parsed,
        rawText: data.rawText,
        mode: data.mode,
        notice: data.notice
      };
      persistDrafts([nextDraft, ...drafts].slice(0, 8));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to generate campaign.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectDraft(draft: SavedCampaignDraft) {
    setValues(draft.values);
    setCampaign(draft.campaign);
    setParsed(draft.parsed);
    setMode(draft.mode);
    setNotice(draft.notice || null);
    setRawText(draft.rawText);
    setError(null);
  }

  function resetWorkspace() {
    setValues(initialCampaignFormValues);
    setCampaign(null);
    setParsed(true);
    setMode(undefined);
    setNotice(null);
    setRawText("");
    setError(null);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase text-coral">
                MAXTech/BoldTrail draft workspace
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold text-ink sm:text-5xl">
                Real Estate AI Campaign Assistant
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
                Generate reviewed-before-send campaign drafts for follow-up texts, emails, nurture
                sequences, social posts, newsletters, and CRM campaign setup.
              </p>
            </div>
            <div className="bg-evergreen p-6 text-white sm:p-8">
              <p className="text-sm font-semibold uppercase text-wheat">Draft-only mode</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/86">
                <p>No emails or texts are sent automatically.</p>
                <p>Review every draft for accuracy, consent, compliance, and local market context before use.</p>
                <p>MAXTech/BoldTrail, Zapier, and webhook integrations are typed placeholders for now.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6 lg:sticky lg:top-6">
            <h2 className="mb-4 text-xl font-semibold text-ink">Campaign Inputs</h2>
            <CampaignForm
              values={values}
              onChange={setValues}
              onSubmit={generateCampaign}
              isLoading={isLoading}
              hasGenerated={Boolean(campaign)}
              onLoadSample={() => setValues(sampleCampaignFormValues)}
              onReset={resetWorkspace}
            />
            <CampaignSelectorPanel values={values} />
            <DraftHistory
              drafts={drafts}
              onSelect={selectDraft}
              onClear={() => persistDrafts([])}
            />
          </section>

          <section>
            <GeneratedOutput
              campaign={campaign}
              isLoading={isLoading}
              error={error}
              parsed={parsed}
              values={values}
              mode={mode}
              notice={notice || (rawText ? null : undefined)}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
