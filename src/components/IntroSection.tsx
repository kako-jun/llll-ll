"use client";

import { useState } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import ArrowIcon from "./ArrowIcon";

interface IntroSectionProps {
  language: Language;
}

export default function IntroSection({ language }: IntroSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslation(language);

  return (
    <section style={{ padding: "2rem 0" }} className="fade-in">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "var(--primary-color)",
            }}
          >
            {language === "en" ? (
              <>
                {t.welcome}{" "}
                <span className="logo-font" style={{ fontSize: "1.8rem" }}>
                  llll-ll
                </span>
              </>
            ) : language === "zh" ? (
              <>
                {t.welcome}{" "}
                <span className="logo-font" style={{ fontSize: "1.8rem" }}>
                  llll-ll
                </span>
              </>
            ) : (
              <>
                <span className="logo-font" style={{ fontSize: "1.8rem" }}>
                  llll-ll
                </span>{" "}
                {t.welcome}
              </>
            )}
          </h2>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
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

        {isExpanded && (
          <div style={{ maxWidth: "600px", margin: "0 auto" }} className="slide-up">
            <div
              style={{
                backgroundColor: "var(--input-background)",
                padding: "2rem",
                border: "1px solid var(--border-color)",
                marginBottom: "2rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textAlign: "center",
                  color: "#28a745",
                }}
              >
                {t.aboutTitle}
              </h3>
              <p
                style={{
                  color: "#6c757d",
                  textAlign: "center",
                  lineHeight: "1.6",
                }}
              >
                {t.intro}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
