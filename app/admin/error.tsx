"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error.message, error.digest);
  }, [error]);

  const isDbError =
    /connect|database|relation|does not exist|ECONNREFUSED|P\d{4}/i.test(
      error.message ?? ""
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>

      <h1 className="text-xl font-bold text-white mb-2">
        {isDbError ? "Database Unavailable" : "Something Went Wrong"}
      </h1>

      <p className="text-slate-400 text-sm max-w-md mb-6">
        {isDbError
          ? "Could not connect to the database. Ensure DATABASE_URL is set correctly in Vercel and the Supabase project is active."
          : error.message || "An unexpected server error occurred."}
      </p>

      {error.digest && (
        <p className="text-xs text-slate-600 mb-4 font-mono">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
