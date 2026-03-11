"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="it">
      <body style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#ffffff",
            color: "#1a1a1a",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              padding: "32px",
              background: "#f8f9fa",
              borderRadius: "12px",
              border: "2px solid #dc3545",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: "16px",
              }}
            >
              Application error
            </h2>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#333333",
                marginBottom: "20px",
              }}
            >
              A critical error occurred. Check the browser
              console (F12) for more details.
            </p>
            <pre
              style={{
                padding: "16px",
                background: "#1a1a1a",
                color: "#00ff88",
                borderRadius: "8px",
                fontSize: "13px",
                overflow: "auto",
                marginBottom: "20px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </pre>
            <button
              onClick={() => reset()}
              style={{
                padding: "12px 24px",
                background: "#6366F1",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
