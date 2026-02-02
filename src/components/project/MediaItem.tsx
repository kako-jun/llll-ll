import { memo } from "react";

interface MediaItemProps {
  type: "image" | "video" | "animation";
  src: string;
  title: string;
  index: number;
  noImageText: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default memo(function MediaItem({
  type,
  src,
  title,
  index,
  noImageText,
  onClick,
}: MediaItemProps) {
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "140px",
    overflow: "hidden",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    position: "relative",
    cursor: onClick ? "pointer" : "default",
    backgroundColor: "var(--input-background)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
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
