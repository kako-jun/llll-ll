import { memo } from "react";

interface ProfileIconProps {
  imageUrl: string;
  profileUrl: string;
  alt: string;
}

export default memo(function ProfileIcon({ imageUrl, profileUrl, alt }: ProfileIconProps) {
  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="profile-icon"
      style={{
        position: "absolute",
        top: "-30px",
        left: "50%",
        transform: "translateX(-183px)",
        width: "80px",
        height: "80px",
        backgroundColor: "var(--input-background)",
        border: "2px solid var(--border-color)",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.7rem",
        color: "var(--muted-text)",
        textAlign: "center",
        textDecoration: "none",
        zIndex: 10,
        transition: "all 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateX(-183px) scale(1.05)";
        e.currentTarget.style.backgroundColor = "var(--hover-color, rgba(0,0,0,0.1))";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateX(-183px) scale(1)";
        e.currentTarget.style.backgroundColor = "var(--input-background)";
      }}
    >
      <img
        src={imageUrl}
        alt={alt}
        width={80}
        height={80}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "4px",
        }}
      />
    </a>
  );
});
