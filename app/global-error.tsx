"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, fontSize: "1.125rem" }}>Something went wrong</p>
          <p style={{ color: "#666", marginTop: "0.5rem", maxWidth: "24rem" }}>
            {error.message || "An unexpected error occurred loading the app."}
          </p>
          {error.digest && (
            <p style={{ color: "#999", marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
