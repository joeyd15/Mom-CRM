"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedCampaignsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSeed() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/campaigns/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult("✓ Default campaigns created");
        router.refresh();
        setTimeout(() => setResult(null), 4000);
      } else {
        setResult(`✗ ${data.error ?? data.message}`);
      }
    } catch {
      setResult("✗ Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 bg-purple-900/40 hover:bg-purple-800/50 disabled:opacity-50 text-purple-300 text-sm rounded-xl border border-purple-700/40 transition-colors"
      >
        {loading ? "Seeding..." : "Seed Default Campaigns"}
      </button>
      {result && (
        <p
          className={`text-xs mt-1 ${
            result.startsWith("✓") ? "text-green-400" : "text-red-400"
          }`}
        >
          {result}
        </p>
      )}
    </div>
  );
}
