
import { useState, useEffect } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import ArrowIcon from "./ArrowIcon";

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

      {/* 絶対確実な吹き出し */}
      {isExpanded && buttonRect && (
        <div
          style={{
            position: "fixed",
            top: `${buttonRect.bottom + 20}px`,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--input-background)",
            border: "2px solid var(--primary-color)",
            borderRadius: "16px",
            padding: "2rem",
            width: "500px",
            maxWidth: "95vw",
            zIndex: 5,
          }}
        >
          {/* 確実な三角形 */}
          <div
            style={{
              position: "absolute",
              top: "-14px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderBottom: "14px solid var(--primary-color)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: "12px solid var(--input-background)",
            }}
          />

          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "var(--primary-color)",
            }}
          >
            {t.aboutTitle}
          </h3>
          <div
            style={{
              color: "var(--text-color)",
              textAlign: "left",
              lineHeight: "1.8",
              fontSize: "1.1rem",
              fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "300px",
              overflowY: "auto",
              padding: "0 1rem",
            }}
          >
            {t.intro}
          </div>
        </div>
      )}
    </>
  );
}
