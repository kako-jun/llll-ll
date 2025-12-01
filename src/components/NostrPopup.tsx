import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { useNostr } from "@/hooks/useNostr";
import { nip19 } from 'nostr-tools';

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
  const popupLeftX = (window.innerWidth / 2) - (actualPopupWidth / 2);
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
      {/* 上向き三角形（アイコンの正確な位置に配置） */}
      {profileRect && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: "-14px",
              left: `${trianglePosition}px`,
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "14px solid var(--primary-color)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-12px",
              left: `${trianglePosition}px`,
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "12px solid var(--input-background)",
            }}
          />
        </>
      )}
      
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
              <div
                key={post.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--background-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  {(() => {
                    // 画像URLを抽出
                    const imageUrls = post.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
                    // 画像URL以外のテキスト
                    let textContent = post.content;
                    imageUrls.forEach(url => {
                      textContent = textContent.replace(url, '').trim();
                    });
                    
                    return (
                      <>
                        {textContent && (
                          <p style={{ 
                            fontSize: "0.9rem", 
                            lineHeight: "1.6",
                            wordBreak: "break-word",
                            marginBottom: imageUrls.length > 0 ? "1rem" : "0",
                            whiteSpace: "pre-wrap"
                          }}>
                            {textContent.split(/(#[^\s#]+)/g).map((part, index) => {
                              if (part.startsWith('#')) {
                                return (
                                  <a
                                    key={index}
                                    href={`https://iris.to/search/${encodeURIComponent(part)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "var(--primary-color)",
                                      textDecoration: "none"
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.textDecoration = "underline";
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.textDecoration = "none";
                                    }}
                                  >
                                    {part}
                                  </a>
                                );
                              }
                              return part;
                            })}
                          </p>
                        )}
                        {imageUrls.length > 0 && (
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "0.5rem" 
                          }}>
                            {imageUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Image ${index + 1}`}
                                style={{
                                  maxWidth: "100%",
                                  height: "auto",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border-color)"
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  <small style={{ 
                    color: "var(--muted-text)", 
                    fontSize: "0.8rem" 
                  }}>
                    {new Date(post.created_at * 1000).toISOString().split('T')[0]}
                  </small>
                  <a
                    href={`https://iris.to/${nip19.noteEncode(post.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--link-color)",
                      fontSize: "0.8rem",
                      textDecoration: "none",
                      padding: "0.2rem 0.5rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hover-color, rgba(0,0,0,0.1))";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    View on Iris
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}