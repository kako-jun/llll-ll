import { memo } from "react";

interface MediaGridProps {
  images: string[];
  videos?: string[];
  animations?: string[];
  title: string;
  noImageText: string;
  onImageClick: (src: string, e: React.MouseEvent) => void;
  onVideoClick: (src: string, e: React.MouseEvent) => void;
}

const MediaItem = memo(function MediaItem({
  type,
  src,
  title,
  index,
  noImageText,
  onClick,
}: {
  type: "image" | "video" | "animation";
  src: string;
  title: string;
  index: number;
  noImageText: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "140px",
    overflow: "hidden",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    position: "relative",
    cursor: onClick ? "pointer" : "default",
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const target = e.currentTarget;
    target.style.display = "none";
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
    placeholder.textContent = type === "video" ? "動画読み込み\nエラー" : noImageText;
    target.parentNode?.appendChild(placeholder);
  };

  if (type === "video") {
    const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");

    if (isYouTube) {
      return (
        <div style={containerStyle} onClick={onClick}>
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <iframe
              src={src.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                pointerEvents: "none",
              }}
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle} onClick={onClick}>
        <video
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.2s ease",
            pointerEvents: "none",
          }}
          muted
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle} onClick={onClick}>
      <img
        src={src}
        alt={`${title} ${type === "animation" ? "animation" : ""} ${index + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: type !== "animation" ? "transform 0.2s ease" : undefined,
        }}
        loading="lazy"
        onMouseOver={
          type !== "animation"
            ? (e) => (e.currentTarget.style.transform = "scale(1.05)")
            : undefined
        }
        onMouseOut={
          type !== "animation" ? (e) => (e.currentTarget.style.transform = "scale(1)") : undefined
        }
        onError={handleError}
      />
    </div>
  );
});

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
