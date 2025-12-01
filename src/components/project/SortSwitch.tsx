import { memo } from "react";

interface SortSwitchProps {
  sortOrder: "newest" | "oldest";
  newestLabel: string;
  oldestLabel: string;
  onToggle: () => void;
  onSetNewest: () => void;
  onSetOldest: () => void;
}

export default memo(function SortSwitch({
  sortOrder,
  newestLabel,
  oldestLabel,
  onToggle,
  onSetNewest,
  onSetOldest,
}: SortSwitchProps) {
  const buttonStyle = (isActive: boolean, isClickable: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    fontSize: "0.9rem",
    color: isActive ? "var(--primary-color)" : "var(--muted-text)",
    cursor: isClickable ? "pointer" : "default",
    fontFamily: "inherit",
    fontWeight: isActive ? "bold" : "normal",
    padding: "0.25rem 0.5rem",
    opacity: isActive ? 0.7 : 1,
    minWidth: "120px",
    textAlign: "center",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginTop: "1rem",
      }}
    >
      <button
        onClick={onSetOldest}
        style={buttonStyle(sortOrder === "oldest", sortOrder === "newest")}
      >
        {oldestLabel}
      </button>

      <div
        style={{
          position: "relative",
          width: "60px",
          height: "30px",
          backgroundColor: sortOrder === "newest" ? "var(--primary-color)" : "var(--border-color)",
          borderRadius: "2px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
        }}
        onClick={onToggle}
      >
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: sortOrder === "newest" ? "33px" : "3px",
            width: "24px",
            height: "24px",
            backgroundColor: "#ffffff",
            borderRadius: "1px",
            transition: "left 0.3s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      <button
        onClick={onSetNewest}
        style={buttonStyle(sortOrder === "newest", sortOrder === "oldest")}
      >
        {newestLabel}
      </button>
    </div>
  );
});
