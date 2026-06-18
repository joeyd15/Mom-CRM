"use client";

import { RefreshCw, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import {
  campaignGoals,
  leadSources,
  leadStages,
  leadTypes,
  tones
} from "@/lib/constants";
import type { CampaignFormValues, CampaignGoal, LeadSource, LeadStage, LeadType, Tone } from "@/lib/types";

interface CampaignFormProps {
  values: CampaignFormValues;
  isLoading: boolean;
  hasGenerated: boolean;
  onChange: (values: CampaignFormValues) => void;
  onSubmit: () => void;
  onLoadSample: () => void;
  onReset: () => void;
}

export default function CampaignForm({
  values,
  isLoading,
  hasGenerated,
  onChange,
  onSubmit,
  onLoadSample,
  onReset
}: CampaignFormProps) {
  function update<K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) {
    onChange({
      ...values,
      [key]: value
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-ink/15 bg-mist px-3 text-sm font-medium text-ink transition hover:border-evergreen hover:text-evergreen"
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          <span>Load sample</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink transition hover:border-coral hover:text-coral"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Agent name" value={values.agentName} onChange={(value) => update("agentName", value)} required />
        <TextField
          label="Brokerage/team name"
          value={values.brokerageName}
          onChange={(value) => update("brokerageName", value)}
        />
        <TextField
          label="City/market"
          value={values.cityMarket}
          onChange={(value) => update("cityMarket", value)}
          required
        />
        <TextField
          label="Lead first name"
          value={values.leadFirstName}
          onChange={(value) => update("leadFirstName", value)}
        />
        <SelectField
          label="Lead type"
          value={values.leadType}
          options={[...leadTypes]}
          onChange={(value) => update("leadType", value as LeadType)}
        />
        <SelectField
          label="Lead source"
          value={values.leadSource}
          options={[...leadSources]}
          onChange={(value) => update("leadSource", value as LeadSource)}
        />
        <SelectField
          label="Lead stage"
          value={values.leadStage}
          options={[...leadStages]}
          onChange={(value) => update("leadStage", value as LeadStage)}
        />
        <SelectField
          label="Campaign goal"
          value={values.campaignGoal}
          options={[...campaignGoals]}
          onChange={(value) => update("campaignGoal", value as CampaignGoal)}
        />
        <SelectField
          label="Tone"
          value={values.tone}
          options={[...tones]}
          onChange={(value) => update("tone", value as Tone)}
        />
      </div>

      <TextAreaField
        label="Property details"
        value={values.propertyDetails}
        onChange={(value) => update("propertyDetails", value)}
        rows={3}
      />
      <TextAreaField
        label="Market notes"
        value={values.marketNotes}
        onChange={(value) => update("marketNotes", value)}
        rows={3}
      />
      <TextAreaField
        label="Additional notes"
        value={values.additionalNotes}
        onChange={(value) => update("additionalNotes", value)}
        rows={3}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-evergreen px-5 py-3 font-semibold text-white shadow-soft transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden />
        )}
        <span>{hasGenerated ? "Regenerate campaign" : "Generate campaign"}</span>
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  required,
  onChange
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-ink outline-none transition placeholder:text-ink/35 focus:border-evergreen focus:ring-4 focus:ring-evergreen/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-ink outline-none transition focus:border-evergreen focus:ring-4 focus:ring-evergreen/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  rows,
  onChange
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-2.5 text-ink outline-none transition placeholder:text-ink/35 focus:border-evergreen focus:ring-4 focus:ring-evergreen/10"
      />
    </label>
  );
}
