import { useState, useEffect } from "react";
import { Language } from "@/types";
import { NostrPopup } from "@/components/nostr";
import SocialLinks from "./SocialLinks";
import ProfileIcon from "./ProfileIcon";

interface FooterProps {
  language: Language;
}

// kako-junのNostr公開鍵
const KAKO_JUN_PUBKEY = "npub1d7rmrw3zmzn9jpcqpzhk6helu8t3rcqk93ja39sh9rgylwr9007q83kemm";
const PROFILE_URL = `https://iris.to/${KAKO_JUN_PUBKEY}`;
const PROFILE_IMAGE_URL =
  "https://imgproxy.snort.social/vuUNpu_hJg6Re01upRTRvP4BvB7224CZYXyL0hZhbDA/dpr:2/aHR0cHM6Ly9pbWFnZS5ub3N0ci5idWlsZC9mMGM3YzdhMDk1ZDFiZThlM2FhYmNmN2QxZTg1YjlhNGEwYjI4NjUzMjQxN2UyNjY3ODViN2QwZThkYjQ3MzllLmpwZw";

export default function Footer({ language }: FooterProps) {
  const [profileRect, setProfileRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateProfilePosition = () => {
      const profile = document.querySelector(".profile-icon") as HTMLElement;
      if (profile) {
        setProfileRect(profile.getBoundingClientRect());
      }
    };

    updateProfilePosition();

    const handleScroll = () => {
      updateProfilePosition();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <>
      <div style={{ marginTop: "1rem", marginBottom: "3rem" }}>
        <NostrPopup
          language={language}
          isExpanded={true}
          profileRect={profileRect}
          pubkey={KAKO_JUN_PUBKEY}
        />
      </div>

      <footer
        style={{
          backgroundColor: "var(--footer-background)",
          borderTop: "1px solid var(--border-color)",
          marginTop: "0",
          padding: "2rem 0 4rem 0",
          position: "relative",
          zIndex: 2,
          backgroundImage: `url('/images/footer-bg.webp'), var(--footer-gradient)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundBlendMode: "var(--footer-blend-mode)",
          transition: "background-color 0.3s ease, background-image 0.3s ease",
        }}
      >
        <ProfileIcon imageUrl={PROFILE_IMAGE_URL} profileUrl={PROFILE_URL} alt="kako-jun profile" />

        <div className="container">
          <SocialLinks />
        </div>
      </footer>
    </>
  );
}
