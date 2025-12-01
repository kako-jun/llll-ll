import { memo } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import LanguageButtons from "./LanguageButtons";
import ContinueButton from "./ContinueButton";
import QRCodeSection from "./QRCodeSection";

interface WelcomeScreenProps {
  currentLang: Language;
  isChanging: boolean;
  onLanguageChange: (lang: Language) => void;
  onContinue: () => void;
}

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
          <ContinueButton currentLang={currentLang} isChanging={isChanging} onClick={onContinue} />

          {/* QR Code Section */}
          <QRCodeSection currentLang={currentLang} isChanging={isChanging} />
        </div>
      </div>
    </div>
  );
});
