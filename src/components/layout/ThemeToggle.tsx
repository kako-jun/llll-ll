import { memo } from "react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  mounted: boolean;
  onToggle: () => void;
}

export default memo(function ThemeToggle({ theme, mounted, onToggle }: ThemeToggleProps) {
  const iconButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    color: "var(--muted-text)",
    cursor: mounted ? (isActive ? "pointer" : "default") : "default",
    padding: "0.25rem",
    opacity: mounted ? (isActive ? 1 : 0.5) : 0.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Sun icon */}
      <button
        onClick={() => theme === "dark" && onToggle()}
        style={iconButtonStyle(theme === "dark")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path
            d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
          />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      </button>

      {/* Toggle switch */}
      <button
        onClick={onToggle}
        style={{
          position: "relative",
          width: "50px",
          height: "24px",
          backgroundColor: mounted ? (theme === "dark" ? "var(--primary-color)" : "#ccc") : "#ccc",
          border: "none",
          borderRadius: "2px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
          padding: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: mounted ? (theme === "dark" ? "26px" : "2px") : "2px",
            width: "20px",
            height: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "1px",
            transition: "left 0.3s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </button>

      {/* Moon icon */}
      <button
        onClick={() => theme === "light" && onToggle()}
        style={iconButtonStyle(theme === "light")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 12.79A9 9 0 1 0 11.79 2 7.2 7.2 0 0 1 2 12.79z" />
          <circle cx="8" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
});
