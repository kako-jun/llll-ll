export type Language = "en" | "zh" | "ja" | "es";

// Web Components用の型定義
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'nostalgic-counter': {
        id?: string;
        type?: 'total' | 'today' | 'yesterday' | 'week' | 'month';
        theme?: 'classic' | 'modern' | 'retro';
        digits?: string;
      };
    }
  }
}

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
  developmentRecordUrl?: string[];
  blogUrl?: string[];
  supportUrl?: string;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}
