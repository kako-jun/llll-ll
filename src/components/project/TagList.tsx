import { memo } from "react";

interface TagListProps {
  tags: string[];
  compact?: boolean;
  maxTags?: number;
}

export default memo(function TagList({ tags, compact = false, maxTags }: TagListProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags ? tags.length - maxTags : 0;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: compact ? "0.25rem" : "0.5rem",
    marginTop: compact ? "0.5rem" : undefined,
    marginBottom: compact ? undefined : "1rem",
  };

  const tagStyle: React.CSSProperties = compact
    ? {
        fontSize: "0.7rem",
        padding: "0.1rem 0.4rem",
        backgroundColor: "var(--input-background)",
        color: "var(--muted-text)",
        border: "1px solid var(--border-color)",
        borderRadius: "0.25rem",
      }
    : {
        fontSize: "0.75rem",
        padding: "0.25rem 0.5rem",
        backgroundColor: "var(--input-background)",
        color: "var(--text-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "0.25rem",
      };

  return (
    <div style={containerStyle}>
      {displayTags.map((tag) => (
        <span key={tag} style={tagStyle}>
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--muted-text)",
          }}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
});
