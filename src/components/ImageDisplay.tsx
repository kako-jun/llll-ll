"use client";

import { useRouter } from "next/navigation";

interface ImageDisplayProps {
  language: string;
}

export default function ImageDisplay({ language }: ImageDisplayProps) {
  const router = useRouter();

  const handleImageClick = () => {
    router.push("/easter-egg");
  };

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
            onClick={handleImageClick}
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "8px",
              objectFit: "cover",
              border: "2px solid var(--border-color)",
              position: "relative",
              zIndex: 1,
              cursor: "pointer",
              transition: "transform 0.2s ease, opacity 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "1";
            }}
          />
        </div>
      </div>
    </section>
  );
}
