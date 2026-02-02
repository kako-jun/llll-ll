import { memo } from "react";
import { ArrowIcon } from "@/components/common";
import TagList from "./TagList";

interface CompactViewProps {
  productId: string;
  title: string;
  truncatedDescription: string;
  images: string[];
  tags: string[];
  isExpanded: boolean;
  isHovered: boolean;
  onToggle: (productId: string) => void;
}

export default memo(function CompactView({
  productId,
  title,
  truncatedDescription,
  images,
  tags,
  isExpanded,
  isHovered,
  onToggle,
}: CompactViewProps) {
  return (
    <div
      style={{
        padding: "1rem",
        cursor: "pointer",
        backgroundColor: isHovered ? "var(--hover-background)" : "var(--background-color)",
        transition: "background-color 0.2s",
      }}
      onClick={() => onToggle(productId)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {images.length > 0 && (
          <div
            style={{
              width: "60px",
              height: "60px",
              flexShrink: 0,
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
            }}
          >
            <img
              src={images[0]}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.2s ease",
              }}
              loading="lazy"
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "0.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "var(--primary-color)",
                margin: 0,
              }}
            >
              {title}
            </h3>
            <ArrowIcon direction={isExpanded ? "up" : "down"} size={16} strokeWidth={2} />
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-color)",
              lineHeight: "1.4",
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: truncatedDescription.replace(/\n/g, "<br>"),
            }}
          />

          {!isExpanded && <TagList tags={tags} compact />}
        </div>
      </div>
    </div>
  );
});
