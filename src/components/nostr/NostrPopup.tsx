import { useEffect } from "react";
import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { PopupTriangle } from "@/components/common";

interface NostrPopupProps {
  language: Language;
  isExpanded: boolean;
  profileRect: DOMRect | null;
  pubkey: string;
  theme?: "light" | "dark";
}

export default function NostrPopup({ language, isExpanded, profileRect, pubkey, theme = "dark" }: NostrPopupProps) {
  const t = useTranslation(language);

  // Load embed.js script
  useEffect(() => {
    const scriptId = "mypace-embed-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://mypace.llll-ll.com/embed.js";
    document.body.appendChild(script);
  }, []);

  // Create mypace-card element using callback ref
  const setContainerRef = (node: HTMLDivElement | null) => {
    if (!node) return;

    // Wait for custom element to be defined
    const tryCreateCard = () => {
      if (customElements.get("mypace-card")) {
        node.innerHTML = "";
        const card = document.createElement("mypace-card");
        card.setAttribute("latest", "");
        card.setAttribute("pubkey", pubkey);
        card.setAttribute("theme", theme);
        node.appendChild(card);
      } else {
        setTimeout(tryCreateCard, 100);
      }
    };
    tryCreateCard();
  };

  if (!isExpanded || !profileRect) return null;

  // アイコンの中央位置（画面上での絶対位置）
  const iconCenterX = profileRect.left + profileRect.width / 2;
  // 実際のポップアップ幅を計算（maxWidthの影響を考慮）
  const actualPopupWidth = Math.min(500, window.innerWidth * 0.95);
  // ポップアップの左端位置
  const popupLeftX = window.innerWidth / 2 - actualPopupWidth / 2;
  // ポップアップ内での三角形の相対位置（PC用微調整）
  const trianglePosition = iconCenterX - popupLeftX + 6;

  return (
    <div
      style={{
        position: "relative",
        margin: "20px auto",
        left: "0",
        transform: "none",
        backgroundColor: "var(--input-background)",
        border: "2px solid var(--primary-color)",
        borderRadius: "16px",
        padding: "2rem",
        width: "500px",
        maxWidth: "95vw",
        zIndex: 5,
      }}
    >
      <PopupTriangle direction="down" position={trianglePosition} />

      <h3
        style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          textAlign: "center",
          color: "var(--primary-color)",
        }}
      >
        {t.nostrPosts}
      </h3>

      <div
        ref={setContainerRef}
        style={{
          maxHeight: "300px",
          overflowY: "auto",
        }}
      />
    </div>
  );
}
