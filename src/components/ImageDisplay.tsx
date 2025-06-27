"use client";

interface ImageDisplayProps {
  language: string;
}

export default function ImageDisplay({ language }: ImageDisplayProps) {
  return (
    <section style={{ padding: "2rem 0 1rem 0", position: "relative", zIndex: 1 }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "1rem",
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
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </section>
  );
}
