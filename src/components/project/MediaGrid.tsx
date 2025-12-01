import { memo } from "react";
import MediaItem from "./MediaItem";

interface MediaGridProps {
  images: string[];
  videos?: string[];
  animations?: string[];
  title: string;
  noImageText: string;
  onImageClick: (src: string, e: React.MouseEvent) => void;
  onVideoClick: (src: string, e: React.MouseEvent) => void;
}

export default memo(function MediaGrid({
  images,
  videos,
  animations,
  title,
  noImageText,
  onImageClick,
  onVideoClick,
}: MediaGridProps) {
  const hasMedia = images.length > 1 || videos?.length || animations?.length;
  if (!hasMedia) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        marginTop: "0.5rem",
      }}
    >
      {videos?.map((video, index) => (
        <MediaItem
          key={`video-${index}`}
          type="video"
          src={video}
          title={title}
          index={index}
          noImageText={noImageText}
          onClick={(e) => onVideoClick(video, e)}
        />
      ))}

      {animations?.map((animation, index) => (
        <MediaItem
          key={`animation-${index}`}
          type="animation"
          src={animation}
          title={title}
          index={index}
          noImageText={noImageText}
        />
      ))}

      {images.slice(1).map((image, index) => (
        <MediaItem
          key={`image-${index + 1}`}
          type="image"
          src={image}
          title={title}
          index={index + 1}
          noImageText={noImageText}
          onClick={(e) => onImageClick(image, e)}
        />
      ))}
    </div>
  );
});
