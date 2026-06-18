"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

const CHANNELS = ["SMS", "Email", "Task", "Call"];
const STATUSES = [
  "New Lead",
  "Contacted",
  "Prospect",
  "Showing Scheduled",
  "Active Client",
  "Nurture",
];
const SOURCES = [
  "Zillow",
  "Zillow Premier Agent",
  "Facebook Lead Form",
  "Instagram",
  "Referral",
  "Website",
  "Manual",
];

interface Step {
  id?: string;
  stepNumber: number;
  channel: string;
  delayHours: number;
  subject: string | null;
  body: string;
  isActive: boolean;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  leadSource: string | null;
  triggerStatus: string | null;
  steps: Step[];
  _count?: { leads: number };
}

interface CampaignEditorProps {
  campaign?: Campaign;
}

export default function CampaignEditor({ campaign }: CampaignEditorProps) {
  const router = useRouter();
  const isNew = !campaign;

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(
    campaign?.description ?? ""
  );
  const [leadSource, setLeadSource] = useState(campaign?.leadSource ?? "");
  const [triggerStatus, setTriggerStatus] = useState(
    campaign?.triggerStatus ?? ""
  );
  const [steps, setSteps] = useState<Step[]>(
    campaign?.steps ?? [
      {
        stepNumber: 0,
        channel: "SMS",
        delayHours: 0,
        subject: "",
        body: "",
        isActive: true,
      },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length,
        channel: "SMS",
        delayHours: 24,
        subject: "",
        body: "",
        isActive: true,
      },
    ]);
  }

  function removeStep(index: number) {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i }))
    );
  }

  function updateStep(index: number, field: keyof Step, value: unknown) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Campaign name is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        name,
        description: description || null,
        leadSource: leadSource || null,
        triggerStatus: triggerStatus || null,
        steps,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/campaigns/${campaign.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
        return;
      }

      const saved = await res.json();
      router.push(`/admin/campaigns/${saved.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <Link
        href="/admin/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {isNew ? "New Campaign" : `Edit: ${campaign.name}`}
        </h1>
        {!isNew && campaign._count && (
          <span className="text-sm text-slate-400">
            {campaign._count.leads} leads enrolled
          </span>
        )}
      </div>

      {/* Campaign Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Campaign Details</h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. New Zillow Lead — Speed to Lead"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What does this campaign do?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Trigger: Lead Source
            </label>
            <select
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any source</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Trigger: Lead Status
            </label>
            <select
              value={triggerStatus}
              onChange={(e) => setTriggerStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Steps ({steps.length})
          </h2>
          <button
            onClick={addStep}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Use{" "}
          <code className="bg-slate-800 px-1 rounded">{"{{firstName}}"}</code>,{" "}
          <code className="bg-slate-800 px-1 rounded">{"{{agentName}}"}</code>,{" "}
          <code className="bg-slate-800 px-1 rounded">
            {"{{propertyAddress}}"}
          </code>
          ,{" "}
          <code className="bg-slate-800 px-1 rounded">{"{{phone}}"}</code> as
          merge tags.
        </p>

        {steps.map((step, i) => (
          <div
            key={i}
            className="border border-slate-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-white">
                  Step {i + 1}
                </span>
              </div>
              <button
                onClick={() => removeStep(i)}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Channel
                </label>
                <select
                  value={step.channel}
                  onChange={(e) => updateStep(i, "channel", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Delay (hours after previous step)
                </label>
                <input
                  type="number"
                  value={step.delayHours}
                  onChange={(e) =>
                    updateStep(i, "delayHours", parseInt(e.target.value) || 0)
                  }
                  min={0}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {(step.channel === "Email" || step.channel === "Task") && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Subject / Task Title
                </label>
                <input
                  value={step.subject ?? ""}
                  onChange={(e) => updateStep(i, "subject", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject or task title..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {step.channel === "Task" ? "Task Description" : "Message Body"}
              </label>
              <textarea
                value={step.body}
                onChange={(e) => updateStep(i, "body", e.target.value)}
                rows={step.channel === "Email" ? 5 : 3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  step.channel === "SMS"
                    ? "Hi {{firstName}}, this is {{agentName}}..."
                    : step.channel === "Email"
                    ? "Dear {{firstName}},\n\nI wanted to reach out..."
                    : "Call {{firstName}} at {{phone}}..."
                }
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? "Saving..." : isNew ? "Create Campaign" : "Save Changes"}
        </button>
        <Link
          href="/admin/campaigns"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
