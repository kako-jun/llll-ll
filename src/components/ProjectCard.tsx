"use client";

import { useState } from "react";
import { Product, Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import ArrowIcon from "./ArrowIcon";

interface ProjectCardProps {
  product: Product;
  language: Language;
  onSelect?: (product: Product) => void;
}

export default function ProjectCard({ product, language, onSelect }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslation(language);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      style={{
        backgroundColor: "var(--background-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px", // 角ばった見た目に
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* コンパクト表示部分 */}
      <div
        style={{
          padding: "1rem",
          cursor: "pointer",
          backgroundColor: isHovered ? "var(--hover-background)" : "var(--background-color)",
          transition: "background-color 0.2s",
        }}
        onClick={handleToggle}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          {product.images.length > 0 && (
            <div
              style={{
                width: "60px",
                height: "60px",
                flexShrink: 0,
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                borderRadius: "4px", // 角ばった見た目に
              }}
            >
              <img
                src={product.images[0]}
                alt={product.title[language] || product.title["en"] || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const placeholder = document.createElement("div");
                  placeholder.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: var(--input-background);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--muted-text);
                    font-size: 0.7rem;
                    text-align: center;
                  `;
                  placeholder.textContent = t.noImage;
                  e.currentTarget.parentNode?.appendChild(placeholder);
                }}
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  color: "var(--primary-color)",
                  margin: 0,
                }}
              >
                {product.title[language] || product.title["en"] || "Untitled"}
              </h3>
              <ArrowIcon direction={isExpanded ? "up" : "down"} size={16} strokeWidth={2} />
            </div>

            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-color)",
                marginBottom: "0.5rem",
                lineHeight: "1.4",
                margin: 0,
              }}
            >
              {(() => {
                const description = product.description[language] || product.description["en"] || "";
                return description.length > 80 && !isExpanded
                  ? `${description.substring(0, 80)}...`
                  : description;
              })()}
            </p>

            {!isExpanded && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.25rem",
                  marginTop: "0.5rem",
                }}
              >
                {product.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.1rem 0.4rem",
                      backgroundColor: "var(--input-background)",
                      color: "var(--muted-text)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "0.25rem",
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {product.tags.length > 4 && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted-text)",
                    }}
                  >
                    +{product.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 展開部分 */}
      {isExpanded && (
        <div
          style={{
            padding: "1rem 1rem 1rem 1rem",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--background-color)",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          {/* 画像・動画・アニメーション表示 */}
          {(product.images.length > 1 || product.videos || product.animations) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                marginTop: "0.5rem",
              }}
            >
              {/* 動画を最初に表示 */}
              {product.videos &&
                product.videos.map((video, index) => (
                  <div
                    key={`video-${index}`}
                    style={{
                      width: "100%",
                      height: "140px",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      position: "relative",
                    }}
                  >
                    {video.includes("youtube.com") || video.includes("youtu.be") ? (
                      <iframe
                        src={video.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={video}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        controls
                        muted
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const placeholder = document.createElement("div");
                          placeholder.style.cssText = `
                            width: 100%;
                            height: 100%;
                            background: var(--input-background);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: var(--muted-text);
                            font-size: 0.7rem;
                            text-align: center;
                          `;
                          placeholder.textContent = "動画読み込み\nエラー";
                          e.currentTarget.parentNode?.appendChild(placeholder);
                        }}
                      />
                    )}
                  </div>
                ))}

              {/* アニメーション画像を次に表示 */}
              {product.animations &&
                product.animations.map((animation, index) => (
                  <div
                    key={`animation-${index}`}
                    style={{
                      width: "100%",
                      height: "140px",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                    }}
                  >
                    <img
                      src={animation}
                      alt={`${product.title[language] || product.title["en"] || "Project"} animation ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const placeholder = document.createElement("div");
                        placeholder.style.cssText = `
                          width: 100%;
                          height: 100%;
                          background: var(--input-background);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: var(--muted-text);
                          font-size: 0.7rem;
                          text-align: center;
                        `;
                        placeholder.textContent = t.noImage;
                        e.currentTarget.parentNode?.appendChild(placeholder);
                      }}
                    />
                  </div>
                ))}

              {/* 通常の画像を最後に表示（2枚目以降） */}
              {product.images.slice(1).map((image, index) => (
                <div
                  key={`image-${index + 1}`}
                  style={{
                    width: "100%",
                    height: "140px",
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                  }}
                >
                  <img
                    src={image}
                    alt={`${product.title[language] || product.title["en"] || "Project"} ${index + 2}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const placeholder = document.createElement("div");
                      placeholder.style.cssText = `
                        width: 100%;
                        height: 100%;
                        background: var(--input-background);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--muted-text);
                        font-size: 0.7rem;
                        text-align: center;
                      `;
                      placeholder.textContent = t.noImage;
                      e.currentTarget.parentNode?.appendChild(placeholder);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 全てのタグ表示 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {product.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "var(--input-background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "0.25rem",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* アクションボタン */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "0.25rem",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  transition: "opacity 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {t.viewDemo}
              </a>
            )}

            {product.repositoryUrl && (
              <a
                href={product.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--background-color)",
                  color: "var(--link-color)",
                  textDecoration: "none",
                  border: "1px solid var(--border-color)",
                  borderRadius: "0.25rem",
                  fontSize: "0.9rem",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hover-background)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--background-color)";
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {t.viewCode}
              </a>
            )}

            {product.developmentRecordUrl && (
              <a
                href={product.developmentRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--background-color)",
                  color: "var(--link-color)",
                  textDecoration: "none",
                  border: "1px solid var(--border-color)",
                  borderRadius: "0.25rem",
                  fontSize: "0.9rem",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hover-background)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--background-color)";
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {t.viewDevelopmentRecord}
              </a>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
