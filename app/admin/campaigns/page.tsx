import { db } from "@/lib/db";
import Link from "next/link";
import { Megaphone, Plus, Users } from "lucide-react";
import ToggleCampaignButton from "@/components/admin/ToggleCampaignButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CampaignsPage() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      steps: { where: { isActive: true }, orderBy: { stepNumber: "asc" } },
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-yellow-400" />
            Campaigns
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {campaigns.length} campaigns
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-medium">No campaigns yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Create your first campaign to start automating lead follow-up.
          </p>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="font-semibold text-white hover:text-blue-300 transition-colors"
                    >
                      {campaign.name}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        campaign.isActive
                          ? "bg-green-900/40 text-green-400 border border-green-700/30"
                          : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                      }`}
                    >
                      {campaign.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {campaign._count.leads} leads enrolled
                    </span>
                    <span>{campaign.steps.length} steps</span>
                    {campaign.leadSource && (
                      <span className="text-blue-400">
                        Source: {campaign.leadSource}
                      </span>
                    )}
                    {campaign.triggerStatus && (
                      <span className="text-purple-400">
                        Trigger: {campaign.triggerStatus}
                      </span>
                    )}
                  </div>

                  {/* Step preview */}
                  {campaign.steps.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                      {campaign.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-1">
                          <div className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                            <span className="text-slate-400">Step {i + 1}:</span>{" "}
                            <span className="text-white">{step.channel}</span>
                            {step.delayHours > 0 && (
                              <span className="text-slate-500">
                                {" "}
                                +{step.delayHours}h
                              </span>
                            )}
                          </div>
                          {i < campaign.steps.length - 1 && (
                            <span className="text-slate-700">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ToggleCampaignButton
                    campaignId={campaign.id}
                    isActive={campaign.isActive}
                  />
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="px-3 py-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
