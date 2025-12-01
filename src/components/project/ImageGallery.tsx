import { memo } from "react";
import { ArrowIcon } from "@/components/common";

interface ImageGalleryProps {
  images: string[];
  currentIndex: number;
  title: string;
  onIndexChange: (index: number) => void;
}

const ThumbnailButton = memo(function ThumbnailButton({
  image,
  index,
  isActive,
  onClick,
}: {
  image: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-16 h-16 pixel-border overflow-hidden ${
        isActive ? "border-text-accent" : "border-border-color"
      }`}
    >
      <img
        src={image}
        alt={`Thumbnail ${index + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const placeholder = document.createElement("div");
          placeholder.className = "w-full h-full flex items-center justify-center";
          placeholder.style.cssText = `
            background: var(--input-background);
            color: var(--muted-text);
            font-size: 0.6rem;
            text-align: center;
          `;
          placeholder.textContent = "×";
          e.currentTarget.parentNode?.appendChild(placeholder);
        }}
      />
    </button>
  );
});

export default memo(function ImageGallery({
  images,
  currentIndex,
  title,
  onIndexChange,
}: ImageGalleryProps) {
  if (images.length === 0) return null;

  const handlePrev = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div className="mb-6">
      {/* Main Image */}
      <div className="aspect-video relative mb-4 pixel-border overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentNode;
            if (parent) {
              const placeholder = document.createElement("div");
              placeholder.className = "w-full h-full flex items-center justify-center";
              placeholder.style.cssText = `
                background: var(--input-background);
                color: var(--muted-text);
                font-size: 1rem;
                text-align: center;
              `;
              placeholder.textContent = "画像を読み込めませんでした";
              parent.appendChild(placeholder);
            }
          }}
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              title="前の画像"
            >
              <ArrowIcon direction="left" size={16} strokeWidth={2} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              title="次の画像"
            >
              <ArrowIcon direction="right" size={16} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <ThumbnailButton
              key={index}
              image={image}
              index={index}
              isActive={index === currentIndex}
              onClick={() => onIndexChange(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
