import { useState, useEffect } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import ArrowIcon from "./ArrowIcon";
import AboutPopup from "./AboutPopup";

interface IntroSectionProps {
  language: Language;
}

export default function IntroSection({ language }: IntroSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const t = useTranslation(language);

  const updateButtonPosition = () => {
    const button = document.querySelector(".about-button") as HTMLElement;
    if (button) {
      setButtonRect(button.getBoundingClientRect());
    }
  };

  const handleButtonClick = () => {
    if (!isExpanded) {
      updateButtonPosition();
    }
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (isExpanded) {
      const handleScroll = () => {
        setIsExpanded(false);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isExpanded]);

  return (
    <>
      <section style={{ padding: "1rem 0", position: "relative" }} className="fade-in">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "var(--primary-color)",
              }}
            >
              {language === "ja" ? (
                <>
                  <span className="logo-font" style={{ fontSize: "1.8rem" }}>
                    llll-ll
                  </span>{" "}
                  {t.welcome}
                </>
              ) : (
                <>
                  {t.welcome}{" "}
                  <span className="logo-font" style={{ fontSize: "1.8rem" }}>
                    llll-ll
                  </span>
                </>
              )}
            </h2>

            <button
              className="about-button"
              onClick={handleButtonClick}
              style={{
                background: "none",
                border: "none",
                color: "var(--link-color)",
                textDecoration: "none",
                fontSize: "1rem",
                cursor: "pointer",
                fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0 auto",
              }}
            >
              {isExpanded ? t.hideAbout : t.showAbout}
              <ArrowIcon
                direction={isExpanded ? "up" : "down"}
                size={16}
                strokeWidth={2}
                style={{
                  transition: "transform 0.3s ease",
                  transform: isExpanded ? "rotate(0deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>
        </div>
      </section>

      {isExpanded && buttonRect && (
        <AboutPopup
          title={t.aboutTitle}
          content={t.intro}
          language={language}
          buttonRect={buttonRect}
        />
      )}
    </>
  );
}
