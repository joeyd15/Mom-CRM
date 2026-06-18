"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-evergreen hover:text-evergreen disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!text.trim()}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
