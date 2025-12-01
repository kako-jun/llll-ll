import { memo } from "react";
import { Language } from "@/types";
import LanguageButtons from "./LanguageButtons";
import ThemeToggle from "./ThemeToggle";

interface LanguageBarProps {
  selectedLanguage: Language;
  theme: "light" | "dark";
  mounted: boolean;
  onLanguageSelect: (lang: Language) => void;
  onThemeToggle: () => void;
}

export default memo(function LanguageBar({
  selectedLanguage,
  theme,
  mounted,
  onLanguageSelect,
  onThemeToggle,
}: LanguageBarProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--background-color)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.5rem 0",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.9rem",
          }}
        >
          <LanguageButtons currentLang={selectedLanguage} onSelect={onLanguageSelect} compact />
          <ThemeToggle theme={theme} mounted={mounted} onToggle={onThemeToggle} />
        </div>
      </div>
    </div>
  );
});
