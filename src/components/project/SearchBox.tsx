import { memo } from "react";

interface SearchBoxProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export default memo(function SearchBox({ value, placeholder, onChange }: SearchBoxProps) {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto 1.5rem", position: "relative" }}>
      {/* Search Icon */}
      <div
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted-text)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="10" cy="10" r="7"></circle>
          <path d="M15.24 15.24L21 21"></path>
        </svg>
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 2.5rem 0.75rem 2.5rem",
          backgroundColor: "var(--input-background)",
          color: "var(--text-color)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          fontSize: "0.9rem",
          fontFamily: "inherit",
        }}
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--muted-text)",
            cursor: "pointer",
            fontSize: "1.2rem",
            lineHeight: "1",
            padding: "0.5rem",
            borderRadius: "2px",
            transition: "all 0.2s ease",
            minWidth: "2rem",
            minHeight: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "var(--text-color)";
            e.currentTarget.style.backgroundColor = "var(--hover-background)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--muted-text)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="検索をクリア"
        >
          ×
        </button>
      )}
    </div>
  );
});
