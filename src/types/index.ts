export type Language = "en" | "zh" | "ja" | "es";

export interface Product {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  tags: string[];
  images: string[];
  animations?: string[];
  videos?: string[];
  demoUrl?: string;
  repositoryUrl?: string;
  developmentRecordUrl?: string;
  supportUrl?: string;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}
