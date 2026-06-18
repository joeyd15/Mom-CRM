"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TestLeadButtonProps {
  type: "zillow" | "facebook" | "random";
  label: string;
}

export default function TestLeadButton({ type, label }: TestLeadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test/fake-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(`✓ Created: ${data.lead.name}`);
        router.refresh();
        setTimeout(() => setResult(null), 4000);
      } else {
        setResult(`✗ ${data.error}`);
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
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-xl border border-slate-700 transition-colors"
      >
        {loading ? "Creating..." : label}
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
