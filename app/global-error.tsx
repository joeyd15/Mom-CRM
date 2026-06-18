"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f172a",
          color: "#f1f5f9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Server Error
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", maxWidth: 480 }}>
          {error.message || "An unexpected server-side error occurred."}
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "1rem" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
