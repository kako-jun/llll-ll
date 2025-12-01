// 画像最適化用ローダー
export default function customImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // 品質設定（デフォルト75%）
  const q = quality || 75;

  // 本番環境では画像最適化サービスを使用可能
  if (import.meta.env.PROD) {
    // 例：Vercel Image Optimization
    return `${src}?w=${width}&q=${q}`;
  }

  // 開発環境ではそのまま返す
  return src;
}
