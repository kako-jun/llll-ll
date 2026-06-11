# llll-ll — Zola migration (btop panel portal)

React19+Vite SPA から **Zola + 自作テーマ avel** への載せ替え試作。
リポジトリ root の React 版は移行完了まで並走させる（Phase 4 で退役）。正本トラッキングは Issue #2（Epic）。

## スタック

- [Zola](https://www.getzola.org/) 0.22+
- テーマ: `themes/avel`（git submodule・`github.com/kako-jun/avel`）
- ポータル top（`templates/index.html`）は avel の base を継承せず自前の **btop 風パネルレイアウト**で完全上書きする試作本体。固まったら avel#18 で panel モードへ昇格する。

## 開発

```bash
# submodule を含めて clone した前提（未取得なら）
git submodule update --init --recursive

cd zola
zola serve            # http://127.0.0.1:1111
zola build            # public/ に出力（git 管理外）

# per-app ページ（content/apps/*.md）は products.json から生成する。
# products.json を変えたら再生成して content/apps を更新・コミットする（冪等）。
node scripts/gen-app-pages.mjs
```

## 構成

```
zola/
├── config.toml            # base_url / 黒×緑 palette([extra]) / theme="avel"
├── content/_index.md      # ホーム（template = index.html）
├── data/products.json     # アプリ20件（root public/data/products.json から移植）
├── templates/
│   ├── index.html         # btop パネルのポータル（自己完結・JSゼロ）
│   └── 404.html           # avel base 非継承の自前 404
└── themes/avel            # submodule
```

## デザイン（黒×緑・btop）

- 一番外枠＝緑ボーダー（`#34d058`）の btop ウィンドウ。デスクトップは `100vh` 固定、apps パネルだけ内部スクロール（緑スクロールバー）、footer 固定。
- palette: bg `#121212` / panel `#1e1e1e` / 枠・アクセント `#34d058` / 文字 `#fff` / muted `#b0b0b0` / link `#60a5fa` / border `#404040`。monospace ベース（DESIGN.md 準拠）。
- スマホ（≤600px）は `100vh` 固定を解除し全パネル縦積み＋普通スクロール。

## フェーズ（Issue #2）

- **Phase 0（#3・このコミット）**: 緑パネルの骨組み＋全20件グリッド・静的・ja のみ。フィルタ/Tetris/カウンタ/日替わり絵は**ガワ・プレースホルダのみ**。
- Phase 1: フィルタ＆検索（#4）・i18n 4言語（#5）・詳細ポップアップ+per-app URL（#13）
- Phase 2: 日替わり絵（#6）・Tetris（#7）・カウンタ/BBS/mypace（#8）・テーマトグル（#9）
- Phase 3: ブログ統合（#10）・SEO/OGP（#11）
- Phase 4: デプロイ切替 CF Pages（#12）・avel panel 昇格（avel#18）
