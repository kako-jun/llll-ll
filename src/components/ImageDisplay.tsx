"use client";

interface ImageDisplayProps {
  language: string;
}

export default function ImageDisplay({ language }: ImageDisplayProps) {
  return (
    <section style={{ padding: "3rem 0 2rem 0" }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: "200px",
              height: "200px",
              backgroundColor: "var(--input-background)",
              border: "2px dashed var(--border-color)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted-text)",
              fontSize: "0.9rem",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* プレースホルダー */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Image placeholder
                <br />
                (200x200)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
