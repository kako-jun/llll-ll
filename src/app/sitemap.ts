import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://llll-ll.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: "https://llll-ll.com/en",
          ja: "https://llll-ll.com/ja",
          zh: "https://llll-ll.com/zh",
        },
      },
    },
  ];
}
