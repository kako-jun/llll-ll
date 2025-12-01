import { memo } from "react";
import { Language } from "@/types";

interface ContinueButtonProps {
  currentLang: Language;
  isChanging: boolean;
  onClick: () => void;
}

const CONTINUE_LABELS: Record<Language, string> = {
  en: "Continue",
  ja: "続行",
  zh: "继续",
  es: "Continuar",
};

export default memo(function ContinueButton({
  currentLang,
  isChanging,
  onClick,
}: ContinueButtonProps) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <button
        onClick={onClick}
        style={{
          backgroundColor: "var(--primary-color)",
          color: "#ffffff",
          border: "none",
          padding: "0.75rem 2rem",
          fontSize: "1.1rem",
          cursor: "pointer",
          fontFamily: currentLang === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          fontWeight: "bold",
          borderRadius: "0.25rem",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.opacity = "1";
        }}
      >
        <span
          style={{
            minWidth: "60px",
            display: "inline-block",
            transition: "opacity 0.2s ease-out",
            opacity: isChanging ? 0 : 1,
          }}
        >
          {CONTINUE_LABELS[currentLang]}
        </span>
      </button>
    </div>
  );
});
