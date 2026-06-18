import { db } from "@/lib/db";
import Link from "next/link";
import LeadFilters from "@/components/admin/LeadFilters";
import { Users, Plus } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const PRIORITY_COLORS: Record<string, string> = {
  Hot: "text-red-400",
  High: "text-orange-400",
  Normal: "text-slate-400",
  Low: "text-slate-600",
  Cold: "text-slate-700",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    source?: string;
    priority?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.source) {
    where.source = { contains: params.source, mode: "insensitive" };
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        campaign: { select: { name: true } },
        _count: { select: { messages: true, activities: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Leads
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total.toLocaleString()} total
            {params.status || params.source || params.priority
              ? " (filtered)"
              : ""}
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      {/* Filters */}
      <LeadFilters
        currentStatus={params.status}
        currentSource={params.source}
        currentPriority={params.priority}
      />

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Lead
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Source
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Campaign
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Added
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No leads found.{" "}
                    {params.status || params.source
                      ? "Try clearing filters."
                      : "Sync Follow Up Boss to import leads."}
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {lead.name}
                          {lead.priority === "Hot" && (
                            <span className="text-xs">🔥</span>
                          )}
                          {lead.priority === "High" && (
                            <span
                              className={`text-xs ${PRIORITY_COLORS.High}`}
                            >
                              ↑
                            </span>
                          )}
                        </div>
                        {lead.propertyAddress && (
                          <div className="text-xs text-slate-500 truncate max-w-48">
                            {lead.propertyAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-xs">
                      {lead.email ?? "—"}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {lead.phone ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-300">{lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-lg border font-medium whitespace-nowrap ${
                        STATUS_COLORS[lead.status] ??
                        "bg-slate-700 text-slate-400 border-slate-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.campaign ? (
                      <span className="text-xs text-blue-400 truncate max-w-32 block">
                        {lead.campaign.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/leads?page=${page - 1}&status=${params.status ?? ""}&source=${params.source ?? ""}`}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                >
                  ← Prev
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`/admin/leads?page=${page + 1}&status=${params.status ?? ""}&source=${params.source ?? ""}`}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
