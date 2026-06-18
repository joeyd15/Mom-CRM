"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit3,
  AlertTriangle,
} from "lucide-react";

const STATUS_OPTIONS = [
  "New Lead",
  "Contacted",
  "Prospect",
  "Showing Scheduled",
  "Active Client",
  "Nurture",
  "Closed",
  "Lost",
  "Do Not Contact",
];

const PRIORITY_OPTIONS = ["Hot", "High", "Normal", "Low", "Cold"];

const STATUS_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Contacted: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Prospect: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Showing Scheduled": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Active Client": "bg-green-500/20 text-green-400 border-green-500/30",
  Nurture: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Lost: "bg-red-500/20 text-red-400 border-red-500/30",
  "Do Not Contact": "bg-gray-700/50 text-gray-500 border-gray-600/30",
};

const ACTIVITY_ICONS: Record<string, string> = {
  sync: "🔄",
  webhook: "🔗",
  ai_action: "🤖",
  note: "📝",
  status_change: "🔀",
  campaign: "📣",
  task: "✅",
  opt_out: "🚫",
  error: "❌",
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  priority: string;
  propertyAddress: string | null;
  inquiryMessage: string | null;
  assignedAgent: string | null;
  notes: string | null;
  aiSummary: string | null;
  aiRecommendedNextStep: string | null;
  followUpBossId: string | null;
  campaignId: string | null;
  campaignStage: number;
  optedOut: boolean;
  doNotContact: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  campaign: { id: string; name: string; steps: unknown[] } | null;
  activities: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: Date;
  }[];
  messages: {
    id: string;
    channel: string;
    direction: string;
    status: string;
    subject: string | null;
    body: string;
    createdAt: Date;
    sentAt: Date | null;
  }[];
};

interface LeadDetailClientProps {
  lead: Lead;
  campaigns: { id: string; name: string }[];
}

export default function LeadDetailClient({
  lead: initialLead,
  campaigns,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingMsg, setAiLoadingMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "messages">(
    "timeline"
  );

  async function updateLead(updates: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setLead((prev) => ({ ...prev, ...updated }));
      router.refresh();
    }
  }

  async function saveNotes() {
    setSaving(true);
    await updateLead({ notes });
    setSaving(false);
    setEditingNotes(false);
  }

  async function runAI(action: string) {
    setAiLoading(true);
    setAiLoadingMsg(
      action === "summarize"
        ? "Analyzing lead..."
        : `Generating ${action.replace("generate_", "")}...`
    );
    try {
      const res = await fetch(`/api/leads/${lead.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "summarize" && data.result) {
        setLead((prev) => ({
          ...prev,
          aiSummary: data.result.summary ?? prev.aiSummary,
          aiRecommendedNextStep:
            data.result.nextStep ?? prev.aiRecommendedNextStep,
          priority: data.result.priority ?? prev.priority,
        }));
      }
      router.refresh();
    } finally {
      setAiLoading(false);
      setAiLoadingMsg("");
    }
  }

  async function approveMessage(messageId: string) {
    await fetch(`/api/messages/${messageId}/approve`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      {/* Lead Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-300 shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {lead.name}
                {lead.priority === "Hot" && <span>🔥</span>}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                    STATUS_COLORS[lead.status] ??
                    "bg-slate-700 text-slate-400 border-slate-600"
                  }`}
                >
                  {lead.status}
                </span>
                <span className="text-xs text-slate-400">
                  {lead.source}
                </span>
                {lead.followUpBossId && (
                  <span className="text-xs text-slate-500">
                    FUB #{lead.followUpBossId}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400 mt-2 space-y-0.5">
                {lead.email && <div>✉️ {lead.email}</div>}
                {lead.phone && <div>📞 {lead.phone}</div>}
                {lead.propertyAddress && (
                  <div>🏠 {lead.propertyAddress}</div>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <select
              value={lead.status}
              onChange={(e) => updateLead({ status: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={lead.priority}
              onChange={(e) => updateLead({ priority: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inquiry */}
        {lead.inquiryMessage && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
              Inquiry Message
            </p>
            <p className="text-sm text-slate-300">{lead.inquiryMessage}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: AI + Campaign */}
        <div className="lg:col-span-1 space-y-4">
          {/* AI Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span>🤖</span> AI Analysis
              </h2>
              <button
                onClick={() => runAI("summarize")}
                disabled={aiLoading}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${aiLoading && aiLoadingMsg.includes("Analyzing") ? "animate-spin" : ""}`}
                />
                {aiLoading && aiLoadingMsg.includes("Analyzing")
                  ? "Analyzing..."
                  : "Re-analyze"}
              </button>
            </div>

            {lead.aiSummary ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                    Summary
                  </p>
                  <p className="text-sm text-slate-300">{lead.aiSummary}</p>
                </div>
                {lead.aiRecommendedNextStep && (
                  <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl">
                    <p className="text-xs text-blue-400 font-medium mb-1">
                      ⚡ Recommended Next Step
                    </p>
                    <p className="text-sm text-blue-200">
                      {lead.aiRecommendedNextStep}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-3">
                  No AI analysis yet
                </p>
                <button
                  onClick={() => runAI("summarize")}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  {aiLoading ? aiLoadingMsg : "Analyze Lead"}
                </button>
              </div>
            )}

            {/* Generate messages */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => runAI("generate_sms")}
                disabled={aiLoading || lead.optedOut || lead.doNotContact}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs rounded-xl transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                Draft SMS
              </button>
              <button
                onClick={() => runAI("generate_email")}
                disabled={aiLoading || lead.optedOut || lead.doNotContact}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs rounded-xl transition-colors"
              >
                <Mail className="w-3 h-3" />
                Draft Email
              </button>
            </div>
          </div>

          {/* Campaign */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Campaign
            </h2>
            {lead.campaign ? (
              <div>
                <p className="text-sm text-white font-medium">
                  {lead.campaign.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Step {lead.campaignStage + 1} of{" "}
                  {(lead.campaign.steps as unknown[]).length}
                </p>
                <button
                  onClick={() =>
                    updateLead({ campaignId: null, campaignStage: 0 })
                  }
                  className="mt-3 text-xs text-red-400 hover:text-red-300"
                >
                  Remove from campaign
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Not enrolled in a campaign
                </p>
                <select
                  onChange={(e) =>
                    e.target.value &&
                    updateLead({ campaignId: e.target.value, campaignStage: 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="">Assign campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Notes
              </h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this lead..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveNotes}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setNotes(lead.notes ?? "");
                    }}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {lead.notes ?? "No notes yet. Click Edit to add notes."}
              </p>
            )}
          </div>

          {/* DNC Warning */}
          {(lead.optedOut || lead.doNotContact) && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-medium">
                  {lead.doNotContact ? "Do Not Contact" : "Opted Out"}
                </p>
                <p className="text-red-400/70 text-xs mt-0.5">
                  No messages will be sent to this lead.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline & Messages */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "timeline"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Timeline ({lead.activities.length})
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "messages"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Messages ({lead.messages.length})
            </button>
          </div>

          <div className="p-5">
            {activeTab === "timeline" && (
              <div className="space-y-3">
                {lead.activities.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No activity yet
                  </p>
                )}
                {lead.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-base shrink-0 mt-0.5">
                      {ACTIVITY_ICONS[activity.type] ?? "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-4">
                {lead.messages.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No messages yet. Use the AI buttons to draft messages.
                  </p>
                )}
                {lead.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 uppercase font-medium">
                          {msg.channel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            msg.status === "sent"
                              ? "bg-green-900/40 text-green-400"
                              : msg.status === "pending"
                              ? "bg-yellow-900/40 text-yellow-400"
                              : msg.status === "failed"
                              ? "bg-red-900/40 text-red-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {msg.subject && (
                      <p className="text-sm font-medium text-white mb-1">
                        {msg.subject}
                      </p>
                    )}
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {msg.body}
                    </p>
                    {msg.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveMessage(msg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve & Send
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg">
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                    {msg.status === "sent" && msg.sentAt && (
                      <p className="text-xs text-green-400/70 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Sent {new Date(msg.sentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
