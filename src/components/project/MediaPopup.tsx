import { createPortal } from "react-dom";
import { ArrowIcon } from "@/components/common";

interface MediaPopupProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  onClose: () => void;
}

export default function MediaPopup({ imageUrl, videoUrl, onClose }: MediaPopupProps) {
  if (typeof window === "undefined") return null;
  if (!imageUrl && !videoUrl) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    padding: "2rem",
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "32px",
    height: "32px",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    border: "none",
    borderRadius: "50%",
    fontSize: "1.2rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  };

  if (imageUrl) {
    return createPortal(
      <div style={overlayStyle} onClick={onClose}>
        <div
          style={{
            position: "relative",
            maxWidth: "90%",
            maxHeight: "90%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt="拡大画像"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              border: "2px solid var(--primary-color)",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--text-color)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-color)")}
          >
            <ArrowIcon direction="close" size={16} strokeWidth={2} />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (videoUrl) {
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const embedUrl = isYouTube
      ? videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
      : videoUrl;

    return createPortal(
      <div style={overlayStyle} onClick={onClose}>
        <div
          style={{
            position: "relative",
            width: "95vw",
            height: "95vh",
            maxWidth: "1200px",
            maxHeight: "675px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isYouTube ? (
            <iframe
              src={embedUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "2px solid var(--primary-color)",
                borderRadius: "4px",
              }}
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                border: "2px solid var(--primary-color)",
                borderRadius: "4px",
              }}
              controls
              autoPlay
            />
          )}
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--text-color)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-color)")}
          >
            <ArrowIcon direction="close" size={16} strokeWidth={2} />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}
