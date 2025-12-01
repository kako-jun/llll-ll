import { memo } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import LanguageButtons from "./LanguageButtons";

interface WelcomeScreenProps {
  currentLang: Language;
  isChanging: boolean;
  onLanguageChange: (lang: Language) => void;
  onContinue: () => void;
}

const CONTINUE_LABELS: Record<Language, string> = {
  en: "Continue",
  ja: "続行",
  zh: "继续",
  es: "Continuar",
};

export default memo(function WelcomeScreen({
  currentLang,
  isChanging,
  onLanguageChange,
  onContinue,
}: WelcomeScreenProps) {
  const t = useTranslation(currentLang);

  const getFontFamily = (lang: Language) =>
    lang === "zh" || lang === "ja" ? "'Noto Sans SC', sans-serif" : "inherit";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background-color)",
      }}
    >
      <div className="container">
        <div style={{ textAlign: "center" }}>
          {/* Logo */}
          <h1
            className="logo-font"
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              margin: "0",
              lineHeight: "1",
              color: "var(--primary-color)",
            }}
          >
            llll-ll
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "0.9rem",
              margin: "0.6rem 0 2rem 0",
              lineHeight: "1",
              color: "var(--primary-color)",
              fontFamily: getFontFamily(currentLang),
              transition: "opacity 0.2s ease-out",
              opacity: isChanging ? 0 : 1,
            }}
          >
            {t.siteSubtitle}
          </p>

          {/* Message */}
          <p
            style={{
              fontSize: "1.2rem",
              marginBottom: "3rem",
              color: "var(--text-color)",
              fontFamily: currentLang === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
              transition: "opacity 0.2s ease-out",
              minHeight: "1.8rem",
              opacity: isChanging ? 0 : 1,
            }}
          >
            {t.redDoorMessage}
          </p>

          {/* Language Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "3rem",
            }}
          >
            <LanguageButtons
              currentLang={currentLang}
              onSelect={onLanguageChange}
              compact={false}
            />
          </div>

          {/* Continue Button */}
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={onContinue}
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

          {/* QR Code Section */}
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--muted-text)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                transition: "opacity 0.2s ease-out",
                minHeight: "1.2rem",
                opacity: isChanging ? 0 : 1,
              }}
            >
              {t.forMobileDevices}
            </div>
            <img
              src="/qrcode.webp"
              alt="QR Code for mobile access"
              style={{
                width: "120px",
                height: "120px",
                border: "none",
                borderRadius: "0",
                opacity: "0.7",
                filter: "brightness(0.8)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
