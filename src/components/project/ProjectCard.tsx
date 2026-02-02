import { useState } from "react";
import { Product, Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import MediaPopup from "./MediaPopup";
import CompactView from "./CompactView";
import ExpandedView from "./ExpandedView";

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
      <CompactView
        productId={product.id}
        title={title}
        truncatedDescription={truncatedDescription}
        images={product.images}
        tags={product.tags}
        isExpanded={isExpanded}
        isHovered={isHovered}
        onToggle={onToggle}
      />

      {/* 展開部分 */}
      {isExpanded && (
        <ExpandedView
          images={product.images}
          videos={product.videos}
          animations={product.animations}
          tags={product.tags}
          title={title}
          noImageText={t.noImage}
          demoUrl={product.demoUrl}
          repositoryUrl={product.repositoryUrl}
          articles={product.articles}
          labels={{
            viewDemo: t.viewDemo,
            viewCode: t.viewCode,
          }}
          onImageClick={handleImageClick}
          onVideoClick={handleVideoClick}
        />
      )}

      <MediaPopup imageUrl={popupImage} videoUrl={popupVideo} onClose={closePopup} />
    </div>
  );
}
