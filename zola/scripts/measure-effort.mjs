#!/usr/bin/env node
// 各アプリの「再構築コスト」スナップショットを計測し products.json の effort に書き込む（Issue #51）。
//
// 框組み（CLAUDE.md / Issue #51・kako-jun 承認）:
//   - 表示は「AI エージェントを使わず人間が一から作り直す場合の再構築コスト」＝資産の再調達価格。
//     kako-jun の実作業時間ではない（AI で速く作る＝それは売り）。算出方法はブログ記事で全公開する。
//   - 数式(COCOMO)は構造的に過剰で難度も見られないため不採用。代わりに「SLOC は scc 実測（事実）＋
//     各アプリを一貫ルーブリックで区分」するハイブリッド。判断は区分割当（基準ベース）に閉じ、調整は
//     グローバル定数のみ（個別の額は曲げない＝バイアス防止）。
//
//   工数(人月) = OVERHEAD + コード行 / コード速度[難度] + データ行 / データ速度[種別]
//   USD       = round2sig(工数 × MONTHLY_RATE)     ← MONTHLY_RATE が唯一のグローバルダイヤル
//
// 漏洩対策: products.json に書くのは数値のみ。私的な絶対パスはハードコードせず REPOS_ROOT を動的解決。
//
// 使い方:
//   node scripts/measure-effort.mjs --dry-run   # 表で出すだけ（書き込まない）
//   node scripts/measure-effort.mjs             # products.json に effort を書き込む

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS = join(__dirname, "..", "data", "products.json");
const REPOS_ROOT = process.env.REPOS_ROOT || join(homedir(), "repos");
const DRY_RUN = process.argv.includes("--dry-run");

// ── ルーブリック定数（全アプリに同一適用・記事で全公開） ───────────────────────────
const OVERHEAD_MONTHS = 0.5; // 全件一律。設計/テスト/リリース/試行錯誤の最低コスト（小アプリの下支え）。
const MONTHLY_RATE = 7000;   // USD/月。スキルある請負開発者の現実線。全体スケールの唯一のダイヤル。
// コード速度（完成・レビュー済みの行/月。AI 無しの人間）。
const CODE_RATE = { hard: 1800, standard: 3500, repetitive: 7000 };
// データ速度（行/月）。人手著作（翻訳・法令訳・言語データ）は遅い、設定/生成物は速い。
const DATA_RATE = { authored: 9000, config: 50000 };

// 区分割当（基準ベース・監査対象）。既定は code=standard / data=config。
//   high難度 = 新規の低レベル/グラフィクス/解読/エンジン（フレームワークに頼れない）。
//   repetitive = 似た部品の量産・設定駆動（1行が軽い）。
//   data authored = 主たる価値が人手の著作コンテンツ（翻訳・法令訳・言語データ）。
const CODE_TIER = { orber: "hard", "tail-match": "repetitive" };
const DATA_TIER = { "noun-gender": "authored", "osaka-kenpo": "authored" };

// id とリポ名がずれるものの例外（既定は repositoryUrl 末尾 → 無ければ id）。
const REPO_OVERRIDES = { chunkundo: "chunkundo.nvim" };

// scc が計測から外すディレクトリ（生成物・依存・ベンダ取り込み）。
const EXCLUDE_DIRS = [
  ".git", "node_modules", "target", "dist", "build", "out", "public",
  "coverage", ".next", ".svelte-kit", ".venv", "venv", "__pycache__",
  ".cache", ".turbo", "vendor", ".astro",
].join(",");

// 「データ」とみなすフォーマット（コードと分けて速度を変える）。
const DATA_LANGS = new Set([
  "CSV", "TSV", "JSON", "YAML", "TOML", "XML", "SVG", "Markdown",
  "Plain Text", "INI", "JSON5",
]);

function round2sig(n) {
  if (n <= 0) return 0;
  const digits = Math.floor(Math.log10(n)) + 1;
  const mag = Math.pow(10, digits - 2);
  return Math.round(n / mag) * mag;
}

function usdLabel(nRaw) {
  const n = round2sig(nRaw);
  if (n >= 1e6) {
    const m = n / 1e6;
    return "$" + (m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")) + "M";
  }
  if (n >= 1e4) return "$" + Math.round(n / 1e3) + "k";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return "$" + n;
}

function effortFor(id, code, data) {
  const codeTier = CODE_TIER[id] || "standard";
  const dataTier = DATA_TIER[id] || "config";
  const months = OVERHEAD_MONTHS + code / CODE_RATE[codeTier] + data / DATA_RATE[dataTier];
  const usd = months * MONTHLY_RATE;
  return { codeTier, dataTier, months, usd };
}

function repoNameOf(p) {
  if (REPO_OVERRIDES[p.id]) return REPO_OVERRIDES[p.id];
  if (p.repositoryUrl) {
    const seg = p.repositoryUrl.replace(/\/+$/, "").split("/").pop();
    if (seg) return seg;
  }
  return p.id;
}

function resolveRepoPath(name) {
  try {
    const out = execFileSync(
      "find",
      [REPOS_ROOT, "-maxdepth", "3", "-type", "d", "-name", name,
       "-not", "-path", "*/node_modules/*", "-not", "-path", "*/vendor/*"],
      { encoding: "utf8" }
    ).trim();
    return out.split("\n").filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

function measure(path) {
  const json = execFileSync(
    "scc",
    ["-f", "json", "--exclude-dir", EXCLUDE_DIRS, path],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  const langs = JSON.parse(json);
  let total = 0, code = 0;
  for (const l of langs) {
    total += l.Code;
    if (!DATA_LANGS.has(l.Name)) code += l.Code;
  }
  return { total, code, data: total - code };
}

const products = JSON.parse(readFileSync(PRODUCTS, "utf8"));
const targets = products.filter((p) => !p.draft);

const rows = [];
const unresolved = [];
for (const p of targets) {
  const name = repoNameOf(p);
  const path = resolveRepoPath(name);
  if (!path) { unresolved.push(`${p.id} (looked for "${name}")`); continue; }
  let m;
  try { m = measure(path); }
  catch (e) { unresolved.push(`${p.id} (scc failed: ${String(e.message).slice(0, 60)})`); continue; }
  rows.push({ id: p.id, ...m, ...effortFor(p.id, m.code, m.data) });
}

// 水準（gauge 0..1）= USD の対数を対象内で正規化（緑の濃さ＝高価さ。色相は緑固定）。
const logs = rows.map((r) => Math.log10(Math.max(r.usd, 1)));
const lo = Math.min(...logs), hi = Math.max(...logs);
for (const r of rows) {
  r.level = hi > lo ? (Math.log10(Math.max(r.usd, 1)) - lo) / (hi - lo) : 0.5;
}

rows.sort((a, b) => b.usd - a.usd);
const pad = (s, n) => String(s).padEnd(n);
console.log(pad("id", 16), pad("code", 8), pad("data", 9), pad("難度/種別", 20), pad("人月", 6), pad("再構築コスト", 12), "lvl");
console.log("-".repeat(86));
for (const r of rows) {
  console.log(
    pad(r.id, 16), pad(r.code.toLocaleString(), 8), pad(r.data.toLocaleString(), 9),
    pad(`${r.codeTier}/${r.dataTier}`, 20), pad(r.months.toFixed(1), 6),
    pad(usdLabel(r.usd), 12), r.level.toFixed(2)
  );
}
console.log("-".repeat(86));
console.log(`計測: ${rows.length} 件 / 対象 non-draft: ${targets.length} 件 / 月単価 $${MONTHLY_RATE}`);
if (unresolved.length) {
  console.log("\n未解決（要 override / 確認）:");
  for (const u of unresolved) console.log("  -", u);
}

if (!DRY_RUN) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const p of products) {
    const r = byId.get(p.id);
    if (r) {
      p.effort = {
        sloc: r.total,
        slocLabel: r.total.toLocaleString("en-US"),
        codeSloc: r.code,
        dataSloc: r.data,
        codeTier: r.codeTier,
        dataTier: r.dataTier,
        personMonths: Math.round(r.months * 10) / 10,
        usd: round2sig(r.usd),
        usdLabel: usdLabel(r.usd),
        level: Math.round(r.level * 100) / 100,
      };
    } else if (p.effort) {
      delete p.effort; // 計測できなくなった（リポ消失等）なら古い値を残さない。
    }
  }
  writeFileSync(PRODUCTS, JSON.stringify(products, null, 2) + "\n");
  // 原本（prettier 既定＝短い配列は inline）の体裁に戻し、差分を effort 追加のみに保つ。
  // prettier 不在でも致命ではない（その場合は配列が多行化して差分が増えるだけ）。
  try {
    execFileSync("npx", ["--yes", "prettier@3", "--write", PRODUCTS], { stdio: "ignore" });
  } catch { /* no-op */ }
  console.log("\n✅ products.json に effort を書き込みました。");
} else {
  console.log("\n(dry-run: products.json は変更していません)");
}
