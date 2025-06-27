// Web Vitals設定 (v4対応)
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  // 本番環境でのみ実行
  if (process.env.NODE_ENV !== "production") return;

  // ここで分析サービスに送信（例：Google Analytics）
  console.log("Web Vitals:", metric);
}

// パフォーマンス測定を開始
export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics); // FIDの代替としてINP
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
