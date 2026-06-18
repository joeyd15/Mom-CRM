"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUSES = [
  "New Lead",
  "Contacted",
  "Prospect",
  "Showing Scheduled",
  "Active Client",
  "Nurture",
];

const SOURCES = [
  "Manual",
  "Zillow",
  "Zillow Premier Agent",
  "Facebook Lead Form",
  "Instagram",
  "Referral",
  "Website",
  "Open House",
  "Other",
];

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Manual",
    status: "New Lead",
    priority: "Normal",
    propertyAddress: "",
    inquiryMessage: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create lead");
        return;
      }
      router.push(`/admin/leads/${data.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      <h1 className="text-2xl font-bold text-white">Add New Lead</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First Last"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Source
            </label>
            <select
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Property Address
            </label>
            <input
              value={form.propertyAddress}
              onChange={(e) => update("propertyAddress", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, Austin TX"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Inquiry Message
            </label>
            <textarea
              value={form.inquiryMessage}
              onChange={(e) => update("inquiryMessage", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What they're looking for..."
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Internal notes..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl"
        >
          {saving ? "Creating..." : "Create Lead"}
        </button>
        <Link
          href="/admin/leads"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
