import { memo } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface QRCodeSectionProps {
  currentLang: Language;
  isChanging: boolean;
}

export default memo(function QRCodeSection({ currentLang, isChanging }: QRCodeSectionProps) {
  const t = useTranslation(currentLang);

  return (
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
  );
});
