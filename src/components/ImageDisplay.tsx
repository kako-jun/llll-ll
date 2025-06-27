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
          <img
            src="/top-image.webp"
            alt="llll-ll top image"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "8px",
              objectFit: "cover",
              border: "2px solid var(--border-color)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
