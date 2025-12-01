import { memo } from "react";

interface TagCloudProps {
  allTags: string[];
  selectedTags: string[];
  clearFiltersLabel: string;
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export default memo(function TagCloud({
  allTags,
  selectedTags,
  clearFiltersLabel,
  onTagToggle,
  onClearAll,
}: TagCloudProps) {
  return (
    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          justifyContent: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {selectedTags.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              background: "none",
              border: "none",
              color: "var(--link-color)",
              textDecoration: "underline",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "0.25rem 0.5rem",
            }}
          >
            {clearFiltersLabel}
          </button>
        )}
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              style={{
                background: isSelected ? "var(--primary-color)" : "var(--input-background)",
                color: isSelected ? "#ffffff" : "var(--muted-text)",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                padding: "0.25rem 0.75rem",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "var(--hover-background)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "var(--input-background)";
                }
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
});
