import { memo } from "react";
import { Language } from "@/types";
import PopupTriangle from "./PopupTriangle";

interface AboutPopupProps {
  title: string;
  content: string;
  language: Language;
  buttonRect: DOMRect;
}

export default memo(function AboutPopup({ title, content, language, buttonRect }: AboutPopupProps) {
  return (
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
      <PopupTriangle direction="up" position="center" />

      <h3
        style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          textAlign: "center",
          color: "var(--primary-color)",
        }}
      >
        {title}
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
        {content}
      </div>
    </div>
  );
});
