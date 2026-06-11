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
# 1アプリにつき4言語分（en=無印 / ja・zh・es は .{lang}.md）を冪等に生成する。
# products.json を変えたら再生成して content/apps を更新・コミットする。
node scripts/gen-app-pages.mjs
```

## i18n（4言語・#5）

Zola 標準の多言語構成。**既定言語 en をルート直下**に置き、他言語は接頭辞を付ける（`default_language = "en"`）。

- URL: `/`（en・canonical）/ `/ja/` / `/zh/` / `/es/`。per-app は `/apps/{id}/`（en）と `/{lang}/apps/{id}/`。
- UI 文言は `config.toml` の `[translations]`（en 既定）＋ `[languages.{ja,zh,es}.translations]`。テンプレは `trans(key=..., lang=lang)` で引く。
- アプリの `title` / `description` は `products.json` の言語キー（`p.title | get(key=lang)`）から表示言語で出す。
- 言語切替は**ナビの実リンク**（静的 per-language ビルド）。localStorage 即時切替はしない（リロードを挟む）。
- ロケール別フォントは `html[lang]` で**システム CJK スタック**を切替（自前 webfont は読み込みブロッキング回避のため不採用）。
- `gen-app-pages.mjs` は id に `.` を含む `chillout.nvim` を、Zola が `.{lang}` を言語コードと誤認しないよう**ファイル名は `chillout-nvim` に sanitize しつつ公開 URL の `path` は `.nvim` を維持**する。

## 構成

```
zola/
├── config.toml            # base_url / palette([extra]) / theme="avel" / default_language=en + [languages.*] translations
├── content/
│   ├── _index.md          # ホーム en（template = index.html）。_index.{ja,zh,es}.md が各言語ホーム
│   └── apps/              # gen-app-pages.mjs が products.json から生成（{id}.md=en + {id}.{lang}.md）
├── data/products.json     # アプリ20件（title/description は en/ja/zh/es の言語キー）
├── templates/
│   ├── index.html         # btop パネルのポータル（自己完結・html[lang]・trans()）
│   ├── app.html           # per-app 詳細 /[{lang}/]apps/{id}/（ポップアップが fetch する .app-detail フラグメント）
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
