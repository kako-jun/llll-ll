import { memo } from "react";

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  size: number;
}

const SOCIAL_LINKS: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/kako-jun", icon: "/icons/github.svg", size: 20 },
  { name: "X", url: "https://x.com/kako_jun_42", icon: "/icons/x-twitter.svg", size: 20 },
  {
    name: "Instagram",
    url: "https://www.instagram.com/kako_jun_42",
    icon: "/icons/instagram.svg",
    size: 20,
  },
  {
    name: "Dev.to",
    url: "https://dev.to/kako-jun",
    icon: "/icons/dev-to-wide-final.png",
    size: 20,
  },
  { name: "Zenn", url: "https://zenn.dev/kako_jun", icon: "/icons/zenn.svg", size: 20 },
  { name: "Note", url: "https://note.com/kako_jun", icon: "/icons/note.svg", size: 24 },
];

const SocialLinkButton = memo(function SocialLinkButton({ link }: { link: SocialLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        textDecoration: "none",
        color: "var(--text-color)",
        transition: "all 0.2s ease",
        borderRadius: "4px",
      }}
      title={link.name}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.backgroundColor = "var(--hover-color, rgba(0,0,0,0.1))";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <img
        src={link.icon}
        alt={link.name}
        width={link.size}
        height={link.size}
        style={{
          filter: "var(--icon-filter, none)",
        }}
      />
    </a>
  );
});

export default memo(function SocialLinks() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "2rem",
        marginTop: "20px",
      }}
    >
      <span style={{ color: "var(--muted-text)", fontSize: "0.9rem" }}>© kako-jun</span>

      {SOCIAL_LINKS.map((link) => (
        <SocialLinkButton key={link.name} link={link} />
      ))}
    </div>
  );
});
