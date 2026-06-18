"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface SyncButtonProps {
  fubConnected: boolean;
}

export default function SyncButton({ fubConnected }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    leadsAdded?: number;
    leadsUpdated?: number;
    error?: string;
  } | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync/follow-up-boss", { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        router.refresh();
      }
    } catch {
      setResult({ success: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span
          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
            result.success
              ? "bg-green-900/40 text-green-400 border border-green-700/40"
              : "bg-red-900/40 text-red-400 border border-red-700/40"
          }`}
        >
          {result.success
            ? `✓ +${result.leadsAdded ?? 0} new, ${result.leadsUpdated ?? 0} updated`
            : `✗ ${result.error}`}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading || !fubConnected}
        title={
          !fubConnected
            ? "Add FOLLOW_UP_BOSS_API_KEY to enable sync"
            : "Sync Follow Up Boss"
        }
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync Follow Up Boss"}
      </button>
    </div>
  );
}
