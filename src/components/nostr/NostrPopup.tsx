import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { useNostr } from "@/hooks/useNostr";
import { PopupTriangle } from "@/components/common";
import NostrPostCard from "./NostrPostCard";

interface NostrPopupProps {
  language: Language;
  isExpanded: boolean;
  profileRect: DOMRect | null;
  pubkey: string;
}

export default function NostrPopup({ language, isExpanded, profileRect, pubkey }: NostrPopupProps) {
  const t = useTranslation(language);
  const { posts, loading, error } = useNostr(pubkey);

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
        className="nostr-content"
        style={{
          color: "var(--text-color)",
          textAlign: "left",
          lineHeight: "1.8",
          fontSize: "1rem",
          fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          maxHeight: "300px",
          overflowY: "auto",
          padding: "0 0.5rem",
          scrollbarColor: "var(--primary-color) var(--input-background)",
        }}
      >
        {loading && <p>{t.loading}</p>}
        {error && <p style={{ color: "var(--error-color, #ff6b6b)" }}>Error: {error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p style={{ color: "var(--muted-text)" }}>No posts found.</p>
        )}
        {!loading && !error && posts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {posts.slice(0, 1).map((post) => (
              <NostrPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
