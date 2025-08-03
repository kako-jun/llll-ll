import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "llll-ll",
  description:
    "Personal portfolio of kako-jun - Games and Apps Developer based in Kanazawa, Japan. Discover innovative mobile apps, web tools, and games.",
  keywords: [
    "portfolio",
    "game developer",
    "app developer",
    "kako-jun",
    "kanazawa",
    "japan",
    "mobile apps",
    "web development",
    "software engineer",
  ],
  authors: [{ name: "kako-jun" }],
  creator: "kako-jun",
  publisher: "kako-jun",
  metadataBase: new URL("https://llll-ll.com"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      ja: "/ja",
      zh: "/zh",
    },
  },
  openGraph: {
    title: "llll-ll",
    description: "Personal portfolio of kako-jun - Games and Apps Developer based in Kanazawa, Japan",
    type: "website",
    locale: "ja_JP",
    alternateLocale: ["en_US", "zh_CN"],
    siteName: "llll-ll",
    images: [
      {
        url: "/favicon.ico",
        width: 32,
        height: 32,
        alt: "llll-ll logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "llll-ll",
    description: "Personal portfolio of kako-jun - Games and Apps Developer based in Kanazawa, Japan",
    creator: "@kako_jun_42",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Nostalgic Counter Web Component */}
        <script src="https://nostalgic-counter.llll-ll.com/components/display.js" async />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "kako-jun",
              url: "https://llll-ll.com",
              sameAs: ["https://github.com/kako-jun", "https://note.com/kako_jun_42", "https://zenn.dev/kako_jun_42"],
              jobTitle: "Software Developer",
              worksFor: {
                "@type": "Organization",
                name: "llll-ll",
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: "Kanazawa",
                "@country": "Japan",
              },
              description: "Games and Apps Developer based in Kanazawa, Japan",
            }),
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
