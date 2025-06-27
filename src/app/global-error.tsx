"use client";

import { useEffect } from "react";
import Link from "next/link";
import ArrowIcon from "@/components/ArrowIcon";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // エラーをログに記録
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#121212",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "'Noto Sans', sans-serif",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#ef4444",
              }}
            >
              ⚠️
            </h1>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#ffffff",
              }}
            >
              Something went wrong! | エラーが発生しました | 出现错误！
            </h2>

            <p
              style={{
                fontSize: "1rem",
                color: "#b0b0b0",
                marginBottom: "2rem",
                maxWidth: "400px",
                lineHeight: "1.6",
              }}
            >
              An unexpected error occurred. Please try again or return to the home page.
              <br />
              予期しないエラーが発生しました。再試行するかホームページに戻ってください。
              <br />
              发生了意外错误。请重试或返回首页。
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#4ade80",
                color: "#000000",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.25rem",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              🔄 Try again | 再試行 | 重试
            </button>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "transparent",
                color: "#4ade80",
                textDecoration: "none",
                border: "1px solid #4ade80",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.25rem",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#4ade80";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#4ade80";
              }}
            >
              <ArrowIcon direction="left" size={16} strokeWidth={2} />
              Home | ホーム | 首页
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
