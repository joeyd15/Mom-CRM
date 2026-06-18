import { db } from "@/lib/db";
import { Zap, Clock, RefreshCw } from "lucide-react";
import SeedCampaignsButton from "@/components/admin/SeedCampaignsButton";
import TestLeadButton from "@/components/admin/TestLeadButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AutomationPage() {
  const [
    settings,
    pendingMessages,
    enrolledLeads,
    recentLogs,
  ] = await Promise.all([
    db.settings.findUnique({ where: { id: "singleton" } }),
    db.message.count({ where: { status: "pending" } }),
    db.lead.count({ where: { campaignId: { not: null } } }),
    db.syncLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const sendMode = settings?.sendMode ?? "disabled";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          Automation
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Background jobs, cron schedule, and testing tools
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Agent Status
          </div>
          <div
            className={`text-lg font-bold ${
              settings?.agentEnabled ? "text-green-400" : "text-red-400"
            }`}
          >
            {settings?.agentEnabled ? "✓ Active" : "✗ Disabled"}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Send Mode
          </div>
          <div
            className={`text-sm font-bold capitalize ${
              sendMode === "auto_send"
                ? "text-green-400"
                : sendMode === "manual_approval"
                ? "text-yellow-400"
                : "text-slate-400"
            }`}
          >
            {sendMode.replace("_", " ")}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Pending Messages
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {pendingMessages}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Leads in Campaigns
          </div>
          <div className="text-lg font-bold text-blue-400">{enrolledLeads}</div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Scheduled Jobs (Vercel Cron)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          These jobs run automatically on the deployed server — your computer
          does not need to be on.
        </p>

        <div className="space-y-3">
          {[
            {
              name: "Sync Follow Up Boss",
              endpoint: "/api/cron/sync-leads",
              schedule: "Every hour",
              description:
                "Pulls new leads from Follow Up Boss and syncs Zillow leads",
            },
            {
              name: "AI Process New Leads",
              endpoint: "/api/cron/ai-process-leads",
              schedule: "Every 15 minutes",
              description:
                "Runs AI agent on new leads: summarize, classify, generate messages",
            },
            {
              name: "Process Campaign Steps",
              endpoint: "/api/cron/process-campaigns",
              schedule: "Every 30 minutes",
              description:
                "Advances enrolled leads through campaign steps, queues messages",
            },
          ].map((job) => (
            <div
              key={job.endpoint}
              className="flex items-start justify-between gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{job.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {job.description}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {job.schedule}
                  </span>
                  <code className="text-slate-600">{job.endpoint}</code>
                </div>
              </div>
              <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-lg border border-green-700/30 shrink-0">
                Scheduled
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Testing Tools */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">
          🧪 Testing Tools
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Use these tools to test the system without real leads. Only available
          in non-production environments.
        </p>

        <div className="flex flex-wrap gap-3">
          <TestLeadButton type="zillow" label="Create Test Zillow Lead" />
          <TestLeadButton type="facebook" label="Create Test Facebook Lead" />
          <TestLeadButton type="random" label="Create Random Test Lead" />
          <SeedCampaignsButton />
        </div>
      </div>

      {/* Sync Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-400" />
          Recent Sync Logs
        </h2>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No sync logs yet</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-xl"
              >
                <div>
                  <span
                    className={`font-medium ${
                      log.status === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {log.status === "success" ? "✓" : "✗"} {log.source}
                  </span>
                  <span className="text-slate-400 ml-2 text-xs">
                    Found: {log.leadsFound} · Added: {log.leadsAdded} ·
                    Updated: {log.leadsUpdated}
                  </span>
                  {log.error && (
                    <div className="text-xs text-red-400 mt-0.5">
                      {log.error}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-600">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
