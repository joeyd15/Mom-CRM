"use client";

import { useState } from "react";
import { Settings, Bot, Send, Clock, AlertTriangle } from "lucide-react";

interface SettingsData {
  agentEnabled: boolean;
  autoClassify: boolean;
  autoCampaign: boolean;
  messageGen: boolean;
  sendMode: string;
  maxMsgPerDay: number;
  businessHoursOnly: boolean;
  businessHoursStart: number;
  businessHoursEnd: number;
}

interface AgentSettingsClientProps {
  settings: SettingsData;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          checked ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function AgentSettingsClient({
  settings: initialSettings,
}: AgentSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(key: keyof SettingsData, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const SEND_MODE_DESCRIPTIONS: Record<string, string> = {
    disabled: "No messages will be sent. All drafts are saved for review only.",
    manual_approval:
      "Messages are drafted by AI and queued. Admin must approve each one before sending.",
    auto_send:
      "Messages are sent automatically. Use with caution — only enable after testing.",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            Agent Settings
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Control how the AI agent behaves
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            saved
              ? "bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-700"
          }`}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>

      {/* AI Agent Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          AI Agent
        </h2>
        <div className="divide-y divide-slate-800">
          <Toggle
            label="Agent Enabled"
            description="Master switch for all AI agent features"
            checked={settings.agentEnabled}
            onChange={(v) => update("agentEnabled", v)}
          />
          <Toggle
            label="Auto-Classify Leads"
            description="Automatically summarize and prioritize new leads with AI"
            checked={settings.autoClassify}
            onChange={(v) => update("autoClassify", v)}
          />
          <Toggle
            label="Auto-Assign Campaigns"
            description="Automatically enroll leads in matching campaigns"
            checked={settings.autoCampaign}
            onChange={(v) => update("autoCampaign", v)}
          />
          <Toggle
            label="Message Generation"
            description="AI generates draft messages for new leads"
            checked={settings.messageGen}
            onChange={(v) => update("messageGen", v)}
          />
        </div>
      </div>

      {/* Send Mode */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-green-400" />
          Send Mode
        </h2>

        <div className="space-y-2">
          {(["disabled", "manual_approval", "auto_send"] as const).map(
            (mode) => (
              <label
                key={mode}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.sendMode === mode
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="sendMode"
                  value={mode}
                  checked={settings.sendMode === mode}
                  onChange={() => update("sendMode", mode)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    {mode === "disabled"
                      ? "Disabled"
                      : mode === "manual_approval"
                      ? "Manual Approval"
                      : "Auto Send"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {SEND_MODE_DESCRIPTIONS[mode]}
                  </div>
                </div>
              </label>
            )
          )}
        </div>

        {settings.sendMode === "auto_send" && (
          <div className="mt-3 p-3 bg-orange-900/20 border border-orange-700/40 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-300">
              Auto Send is enabled. Messages will be sent automatically when
              Twilio/Resend credentials are configured. Make sure you&apos;ve tested
              thoroughly before enabling this in production.
            </p>
          </div>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Business Hours
        </h2>

        <Toggle
          label="Business Hours Only"
          description="Only process and send messages during business hours"
          checked={settings.businessHoursOnly}
          onChange={(v) => update("businessHoursOnly", v)}
        />

        {settings.businessHoursOnly && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Start Hour (24h)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.businessHoursStart}
                onChange={(e) =>
                  update("businessHoursStart", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                9 = 9:00 AM
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                End Hour (24h)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.businessHoursEnd}
                onChange={(e) =>
                  update("businessHoursEnd", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                17 = 5:00 PM
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Max messages per day */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-3">
          Message Limits
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Max Messages Per Lead Per Day
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.maxMsgPerDay}
            onChange={(e) =>
              update("maxMsgPerDay", parseInt(e.target.value))
            }
            className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Prevents over-messaging a single lead
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${
          saved
            ? "bg-green-700 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-700"
        }`}
      >
        {saving ? "Saving..." : saved ? "✓ Settings Saved" : "Save Settings"}
      </button>
    </div>
  );
}
