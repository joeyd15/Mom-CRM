"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  "New Lead",
  "Contacted",
  "Prospect",
  "Showing Scheduled",
  "Active Client",
  "Nurture",
  "Closed",
  "Lost",
];

const PRIORITIES = ["Hot", "High", "Normal", "Low", "Cold"];

const SOURCES = [
  "Zillow",
  "Zillow Premier Agent",
  "Follow Up Boss",
  "Facebook Lead Form",
  "Instagram",
  "Referral",
  "Website",
  "Manual",
];

interface LeadFiltersProps {
  currentStatus?: string;
  currentSource?: string;
  currentPriority?: string;
}

export default function LeadFilters({
  currentStatus,
  currentSource,
  currentPriority,
}: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination
    router.push(`/admin/leads?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/admin/leads");
  }

  const hasFilters = currentStatus || currentSource || currentPriority;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentStatus ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={currentSource ?? ""}
        onChange={(e) => updateFilter("source", e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Sources</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={currentPriority ?? ""}
        onChange={(e) => updateFilter("priority", e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}
