"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ZapOff } from "lucide-react";

interface ToggleCampaignButtonProps {
  campaignId: string;
  isActive: boolean;
}

export default function ToggleCampaignButton({
  campaignId,
  isActive,
}: ToggleCampaignButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400 border border-green-700/30 hover:border-red-700/30"
          : "bg-slate-800 text-slate-400 hover:bg-green-900/30 hover:text-green-400 border border-slate-700 hover:border-green-700/30"
      }`}
    >
      {isActive ? (
        <ZapOff className="w-3 h-3" />
      ) : (
        <Zap className="w-3 h-3" />
      )}
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
