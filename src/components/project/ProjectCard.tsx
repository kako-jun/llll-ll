import { useState } from "react";
import { Product, Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { ArrowIcon } from "@/components/common";
import MediaPopup from "./MediaPopup";
import MediaGrid from "./MediaGrid";
import TagList from "./TagList";
import ActionButtons from "./ActionButtons";

interface ProjectCardProps {
  product: Product;
  language: Language;
  isExpanded: boolean;
  onToggle: (productId: string) => void;
  onSelect?: (product: Product) => void;
}

export default function ProjectCard({ product, language, isExpanded, onToggle }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [popupVideo, setPopupVideo] = useState<string | null>(null);
  const t = useTranslation(language);

  const title = product.title[language] || product.title["en"] || "Untitled";
  const description = product.description[language] || product.description["en"] || "";
  const truncatedDescription =
    description.length > 80 && !isExpanded ? `${description.substring(0, 80)}...` : description;

  const handleImageClick = (imageSrc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPopupImage(imageSrc);
  };

  const handleVideoClick = (videoSrc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPopupVideo(videoSrc);
  };

  const closePopup = () => {
    setPopupImage(null);
    setPopupVideo(null);
  };

  return (
    <div
      id={product.id}
      style={{
        backgroundColor: "var(--background-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px",
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
        onClick={() => onToggle(product.id)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          {product.images.length > 0 && (
            <div
              style={{
                width: "60px",
                height: "60px",
                flexShrink: 0,
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
              }}
            >
              <img
                src={product.images[0]}
                alt={title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.2s ease",
                }}
                loading="lazy"
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
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
                {title}
              </h3>
              <ArrowIcon direction={isExpanded ? "up" : "down"} size={16} strokeWidth={2} />
            </div>

            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-color)",
                lineHeight: "1.4",
                margin: 0,
              }}
              dangerouslySetInnerHTML={{
                __html: truncatedDescription.replace(/\n/g, "<br>"),
              }}
            />

            {!isExpanded && <TagList tags={product.tags} compact maxTags={4} />}
          </div>
        </div>
      </div>

      {/* 展開部分 */}
      {isExpanded && (
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--background-color)",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <MediaGrid
            images={product.images}
            videos={product.videos}
            animations={product.animations}
            title={title}
            noImageText={t.noImage}
            onImageClick={handleImageClick}
            onVideoClick={handleVideoClick}
          />

          <TagList tags={product.tags} />

          <ActionButtons
            demoUrl={product.demoUrl}
            repositoryUrl={product.repositoryUrl}
            developmentRecordUrl={product.developmentRecordUrl}
            labels={{
              viewDemo: t.viewDemo,
              viewCode: t.viewCode,
              viewDevelopmentRecord: t.viewDevelopmentRecord,
            }}
          />
        </div>
      )}

      <MediaPopup imageUrl={popupImage} videoUrl={popupVideo} onClose={closePopup} />
    </div>
  );
}
