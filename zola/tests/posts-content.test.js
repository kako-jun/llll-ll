import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// content/posts/ の最小健全性（#10 Phase 3 blog）。
// 方針（kako-jun）: 記事は日本語で書き、気が向いたものだけ翻訳する。**4言語そろえる義務は作らない。**
// よってここでは「全記事が en/ja/zh/es を揃えているか」は検証しない（翻訳は任意）。
// 検証するのは、存在する各記事ファイルが **テンプレが壊れない最低限の frontmatter** を持つことだけ:
//   - title（一覧・記事見出し）
//   - date（sort_by="date" と前後ナビ page.higher/lower の前提。欠けると順序が壊れる）
// tags は表示専用で任意なので検証しない。

const __dirname = dirname(fileURLToPath(import.meta.url));
const postsDir = join(__dirname, "..", "content", "posts");
const staticDir = join(__dirname, "..", "static");

// 記事本文ファイル（_index.* セクションは除く）。en は `slug.md`、翻訳は `slug.{lang}.md`。
const postFiles = readdirSync(postsDir)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !f.startsWith("_index"));

// +++ ... +++ の TOML frontmatter を取り出す（簡易・依存追加なし）。
function frontmatter(file) {
  const raw = readFileSync(join(postsDir, file), "utf8");
  const parts = raw.split("+++");
  return parts.length >= 3 ? parts[1] : "";
}

function rawPost(file) {
  return readFileSync(join(postsDir, file), "utf8");
}

describe("content/posts 最小健全性", () => {
  it("記事ファイルが1本以上ある", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  for (const file of postFiles) {
    describe(file, () => {
      const fm = frontmatter(file);

      it("title を持つ", () => {
        expect(/(^|\n)\s*title\s*=/.test(fm)).toBe(true);
      });

      it("date を持つ（sort_by=date と前後ナビの前提）", () => {
        expect(/(^|\n)\s*date\s*=/.test(fm)).toBe(true);
      });

      it("古い相対 images/ 参照を残さない", () => {
        expect(/\]\(images\//.test(rawPost(file))).toBe(false);
      });

      it("静的画像参照は実ファイルを持つ", () => {
        const raw = rawPost(file);
        const refs = [...raw.matchAll(/\]\((\/images\/[^)]+)\)/g)].map((m) => m[1]);
        for (const ref of refs) {
          expect(existsSync(join(staticDir, ref.slice(1)))).toBe(true);
        }
      });

      if (file.startsWith("lodestone-ayumi-")) {
        it("Lodestone date は同日内ソート用の時刻を持つ", () => {
          expect(/(^|\n)\s*date\s*=\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+09:00/.test(fm)).toBe(true);
        });

        it("Lodestone 末尾コメントを移植しない", () => {
          const raw = rawPost(file);
          expect(/^## Comments$/m.test(raw)).toBe(false);
          expect(/^### .+ \(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}\)$/m.test(raw)).toBe(false);
        });

        it("Lodestone 画像は /images/ff14/ に集約する", () => {
          const raw = rawPost(file);
          const imageRefs = [...raw.matchAll(/\]\((\/images\/[^)]+)\)/g)].map((m) => m[1]);
          for (const ref of imageRefs) {
            expect(ref.startsWith("/images/ff14/")).toBe(true);
          }
        });
      }
    });
  }
});
