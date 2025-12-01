import { memo } from "react";
import { Language } from "@/types";

interface LanguageButtonsProps {
  currentLang: Language;
  onSelect: (lang: Language) => void;
  compact?: boolean;
}

interface LanguageConfig {
  code: Language;
  labelCompact: string;
  labelFull: string;
}

const LANGUAGES: LanguageConfig[] = [
  { code: "en", labelCompact: "EN", labelFull: "English" },
  { code: "ja", labelCompact: "JP", labelFull: "日本語" },
  { code: "zh", labelCompact: "CN", labelFull: "中文" },
  { code: "es", labelCompact: "ES", labelFull: "Español" },
];

export default memo(function LanguageButtons({
  currentLang,
  onSelect,
  compact = false,
}: LanguageButtonsProps) {
  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    color: isActive ? "var(--primary-color)" : "var(--link-color)",
    textDecoration: "none",
    fontSize: compact ? "0.9rem" : "1rem",
    cursor: "pointer",
    fontFamily: "'Noto Sans', sans-serif",
    fontWeight: isActive ? "bold" : "normal",
    minWidth: compact ? "40px" : "60px",
    textAlign: "center",
    flexShrink: 0,
  });

  const separatorStyle: React.CSSProperties = {
    color: "var(--muted-text)",
    width: compact ? "15px" : undefined,
    textAlign: "center",
    display: "inline-block",
    fontFamily: "'Noto Sans', sans-serif",
    flexShrink: 0,
    fontSize: compact ? undefined : "0.9rem",
    margin: compact ? undefined : "0 0.25rem",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? "0.5rem" : "0.5rem" }}>
      {LANGUAGES.map((lang, index) => (
        <div key={lang.code} style={{ display: "flex", alignItems: "center" }}>
          {index > 0 && <span style={separatorStyle}>|</span>}
          <button
            onClick={() => onSelect(lang.code)}
            onMouseEnter={!compact ? () => onSelect(lang.code) : undefined}
            style={buttonStyle(currentLang === lang.code)}
          >
            {compact ? lang.labelCompact : lang.labelFull}
          </button>
        </div>
      ))}
    </div>
  );
});
