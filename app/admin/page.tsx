import { db } from "@/lib/db";
import { env } from "@/lib/env";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import SyncButton from "@/components/admin/SyncButton";
import { Users, Zap, MessageSquare, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_ORDER = [
  "New Lead",
  "Contacted",
  "Prospect",
  "Showing Scheduled",
  "Active Client",
  "Nurture",
];

const STATUS_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Contacted: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Prospect: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Showing Scheduled": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Active Client": "bg-green-500/20 text-green-400 border-green-500/30",
  Nurture: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

async function getDashboardData() {
  const [
    totalLeads,
    newLeads,
    hotLeads,
    pendingMessages,
    recentLeads,
    leadsByStatus,
    recentSyncs,
    activeCampaigns,
  ] = await Promise.all([
    db.lead.count({ where: { doNotContact: false } }),
    db.lead.count({ where: { status: "New Lead" } }),
    db.lead.count({ where: { priority: "Hot" } }),
    db.message.count({ where: { status: "pending" } }),
    db.lead.findMany({
      where: { doNotContact: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        source: true,
        status: true,
        priority: true,
        aiSummary: true,
        createdAt: true,
        email: true,
        phone: true,
      },
    }),
    db.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { doNotContact: false },
    }),
    db.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.campaign.count({ where: { isActive: true } }),
  ]);

  return {
    totalLeads,
    newLeads,
    hotLeads,
    pendingMessages,
    recentLeads,
    leadsByStatus,
    recentSyncs,
    activeCampaigns,
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const fubConnected = !!env.fubApiKey;

  const statusMap: Record<string, number> = {};
  for (const s of data.leadsByStatus) {
    statusMap[s.status] = s._count._all;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real Estate Lead Hub — AI-Powered
          </p>
        </div>
        <SyncButton fubConnected={fubConnected} />
      </div>

      {/* Warning if no FUB key */}
      {!fubConnected && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div>
            <p className="text-yellow-300 font-medium text-sm">
              Follow Up Boss not connected
            </p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Add{" "}
              <code className="bg-yellow-900/40 px-1 rounded">
                FOLLOW_UP_BOSS_API_KEY
              </code>{" "}
              to your environment variables to sync Zillow leads.{" "}
              <Link
                href="/admin/settings/integrations"
                className="underline hover:text-yellow-200"
              >
                Go to Integrations →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={data.totalLeads}
          color="blue"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="New Leads"
          value={data.newLeads}
          subtext="Need attention"
          color="yellow"
          icon="🆕"
        />
        <StatCard
          label="Hot Leads"
          value={data.hotLeads}
          subtext="High priority"
          color="red"
          icon="🔥"
        />
        <StatCard
          label="Pending Messages"
          value={data.pendingMessages}
          subtext="Awaiting approval"
          color="purple"
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Leads</h2>
            <Link
              href="/admin/leads"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {data.recentLeads.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No leads yet.</p>
                <p className="text-xs mt-1">
                  Sync Follow Up Boss or add a test lead to get started.
                </p>
              </div>
            )}
            {data.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm truncate">
                        {lead.name}
                      </span>
                      {lead.priority === "Hot" && (
                        <span className="text-xs">🔥</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {lead.source} · {lead.email ?? lead.phone ?? "No contact info"}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                        STATUS_COLORS[lead.status] ??
                        "bg-slate-700 text-slate-400 border-slate-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>
                {lead.aiSummary && (
                  <p className="text-xs text-slate-500 mt-2 pl-11 line-clamp-1">
                    🤖 {lead.aiSummary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Lead Pipeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Pipeline
            </h2>
            <div className="space-y-2">
              {STATUS_ORDER.map((status) => {
                const count = statusMap[status] ?? 0;
                const max = Math.max(...Object.values(statusMap), 1);
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">{status}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaigns */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Automation
            </h2>
            <div className="text-3xl font-bold text-white">
              {data.activeCampaigns}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Active campaigns</div>
            <Link
              href="/admin/campaigns"
              className="mt-3 inline-block text-xs text-blue-400 hover:text-blue-300"
            >
              Manage campaigns →
            </Link>
          </div>

          {/* Recent Syncs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-3 text-sm">
              Recent Syncs
            </h2>
            {data.recentSyncs.length === 0 ? (
              <p className="text-xs text-slate-500">No syncs yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentSyncs.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div>
                      <span
                        className={`font-medium ${
                          sync.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sync.status === "success" ? "✓" : "✗"} {sync.source}
                      </span>
                      <div className="text-slate-500">
                        +{sync.leadsAdded} added, {sync.leadsUpdated} updated
                      </div>
                    </div>
                    <span className="text-slate-600">
                      {new Date(sync.createdAt).toLocaleDateString()}
                    </span>
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
