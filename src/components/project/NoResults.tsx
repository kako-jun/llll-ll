import { memo } from "react";

interface NoResultsProps {
  message: string;
}

export default memo(function NoResults({ message }: NoResultsProps) {
  return (
    <div
      style={{
        textAlign: "center",
        color: "var(--muted-text)",
        padding: "3rem 0",
      }}
    >
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      <p>{message}</p>
    </div>
  );
});
