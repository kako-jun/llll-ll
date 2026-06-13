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
- アプリの `title` / `description` は `products.json` の言語キー（`p.title[lang]`・欠けたら en にフォールバック）から表示言語で出す。全エントリが4言語を非空で持つことは `tests/products-data.test.js` が保証する（en 欠落は全言語ビルドを落とすため）。
- 言語切替は**ナビの実リンク**（静的 per-language ビルド）。localStorage 即時切替はしない（リロードを挟む）。
- ロケール別フォントは `html[lang]` で**システム CJK スタック**を切替（自前 webfont は読み込みブロッキング回避のため不採用）。
- `gen-app-pages.mjs` は id に `.` を含む `chillout.nvim` を、Zola が `.{lang}` を言語コードと誤認しないよう**ファイル名は `chillout-nvim` に sanitize しつつ公開 URL の `path` は `.nvim` を維持**する。

## 構成

```
zola/
├── config.toml            # base_url / palette([extra]) / theme="avel" / default_language=en + [languages.*] translations
├── content/
│   ├── _index.md          # ホーム en（template = index.html）。_index.{ja,zh,es}.md が各言語ホーム
│   ├── apps/              # gen-app-pages.mjs が products.json から生成（{id}.md=en + {id}.{lang}.md）
│   └── posts/             # ブログ記事（#10）。_index.* がセクション、{slug}[.{lang}].md が記事
├── data/
│   ├── products.json      # アプリ20件（title/description は en/ja/zh/es の言語キー）
│   └── nostalgic_bbs.toml # 記事URLごとの Nostalgic BBS 公開ID（コメント欄用）
├── templates/
│   ├── index.html         # btop パネルのポータル（自己完結・html[lang]・trans()）
│   ├── app.html           # per-app 詳細 /[{lang}/]apps/{id}/（ポップアップが fetch する .app-detail フラグメント）
│   ├── post.html          # 記事1本 /[{lang}/]posts/{slug}/（btop 自己完結・本文は普通スクロール）
│   ├── posts.html         # ブログ一覧 /[{lang}/]posts/（日付＋タイトル＋タグ）
│   ├── archive.html       # 年別アーカイブ /[{lang}/]archive/
│   ├── tags/              # タグ一覧 /[{lang}/]tags/ とタグ別 /[{lang}/]tags/{name}/
│   └── 404.html           # avel base 非継承の自前 404
├── static/js/             # vanilla JS の島（defer・PE）: theme-toggle / tetris / apps-filter / app-popup / daily-art / visits-counter / mypace-feed
└── themes/avel            # submodule
```

## visits 訪問カウンタ（#8）

visits バー（Total / Today / Yesterday / Week / Month）は **Nostalgic visit カウンタ**から実数を入れる。位置は**3パネル（header/mypace/art of today）の直下**（最上段は言語切替バー＝langbar）。

- カウンタ ID は `config.toml` の `[extra] nostalgic_visit_id`（React 版と同じ `llll-ll-f843ad67`）。テンプレが `data-visit-id` で出す。
- `static/js/visits-counter.js` がロード時に `GET https://api.nostalgic.llll-ll.com/visit?action=increment&id=<id>` を1回叩き（訪問を数えるので `increment`・サーバ側で重複排除）、返った `data.{total,today,yesterday,week,month}` を `[data-visit-stat]` の各スロットへ注入する。
- **PE**: fetch 失敗 / JS 無効なら各スロットは `---` のまま（壊れない）。数値は固定 `,` 3桁区切り（ロケール非依存）。
- 幅狭（`max-width:560px`）では**四角は横並びのまま**、各カウンタの中身（ラベルと数字）を**一斉に2段**（ラベル↑／数字↓）にする。media query なので全カウンタが同時に切替＝「1つでも改行されたら全部」(all-or-nothing)。箱は縦に積まない。
- 右上に「これはなに？」リンク（#47）。mypace の「つぶやき一覧 →」と同じ `.panel-cta` 右上形式で、このカウンタを提供する **Nostalgic のトップ**（`[extra] nostalgic_url` = `https://nostalgic.llll-ll.com/`）へ飛ぶ。文言は4言語の `visits_help`（en: What's this? / ja: これはなに？ / zh: 这是什么？ / es: ¿Qué es esto?）。外部リンクなので `target=_blank rel=noopener noreferrer`。

## サポート BBS（#8）

bbs パネルは **Nostalgic BBS の Web コンポーネント**を埋め込む（案W）。

- `<nostalgic-bbs id="{{ config.extra.nostalgic_bbs_id }}" theme="retro" lang="{{ lang }}" width="100%">`。ID は `[extra] nostalgic_bbs_id`（`llll-ll-f843ad67`・visit と同値）。
- スクリプト `https://nostalgic.llll-ll.com/components/bbs.js`（async）が custom element を定義する。
- **テーマ `retro`**（#0d1117 背景＋#00ff41 緑のターミナル調＝btop と同系。コンポーネントは Shadow DOM なので内部色は外から上書き不可・retro 固定）。
- `lang` で UI/エラー文言をローカライズ（ただし**コンポーネント側の翻訳は現状 ja/en のみ**＝`lang=zh|es` でも BBS 内 UI は英語表示。ホスト側テンプレの文言は4言語）。
- **PE**: JS 無効時は `<noscript>` の `bbs_placeholder`（i18n・「掲示板の表示には JavaScript が必要」）が残る。

## mypace 最新つぶやき（#8）

mypace パネルは **Nostr から最新ノートを取得して btop 黒×緑で自前描画**する（案C。公式 `mypace-card` は iframe で `theme=light` 既定＝世界観を壊すため不採用）。

- `static/js/mypace-feed.js` が `.mypace-feed` の `data-*`（`config.toml [extra]` 由来）を読み、`mypace_relays` の各 relay に WebSocket 接続 → `["REQ",sub,{authors:[mypace_pubkey_hex],kinds:[1],limit}]` → 最新 `mypace_note_limit` 件を描画。
- **pubkey は hex 固定値**（npub をデコード済み・島では bech32 不要）。relays は `relay.damus.io`/`nos.lol`/`relay.primal.net`（ノート実在を確認した3つ）。relay が REQ フィルタを無視した場合に備え、**採用は `kind:1` かつ本人 `pubkey` のイベントだけ**にガードする。
- **各つぶやきはクリックでその投稿へ**（案2）= `https://mypace.llll-ll.com/post/<event.id(hex)>`（`mypace_post_url_base`）。id が 64桁hex のときだけ `<a>` 化。「続きを見る」リンクは置かない。
- **本文は textContent**（innerHTML 禁止＝XSS/世界観防止）、CSS line-clamp で数行 truncate。**相対時刻（"1d" 等）は本文の右に横並び**（改行せず1行分節約）。
- **PE / 例外安全**: 全 relay 失敗・0件・WebSocket 非対応・JS 無効なら既存プレースホルダ維持。描画は `done`/`rendered` で1回のみ（複数 relay の EOSE・タイムアウト 6s のレースに冪等）。`console` を汚さない。
- 純粋関数 `pickLatestNotes`/`relativeTime`/`parseRelayMessage` を export してテスト（jsdom で WebSocket mock の描画・PE・二重描画も検証）。

## ブログ（#10）

`content/posts/` の Markdown を、ポータルと同じ **btop 黒×緑の枠**で出す（avel base は継承せず `app.html` と同流儀で自己完結。固まったら avel#18 へ btop variant として昇格）。

- **セクション**: `content/posts/_index.*`（`sort_by = "date"` / `template = "posts.html"` / `page_template = "post.html"`）。
- **記事**: `{slug}.md`（en）＋任意で `{slug}.{lang}.md`。frontmatter は `title` / `date` 必須、タグは `[taxonomies] tags = [...]` を正本にする。既存テンプレート互換のため `[extra] tags` も併記する。
- **記事ページ** `post.html`: 外枠＋nav はポータルと同じ btop 枠だが、**本文は普通のページスクロール**（top の `100vh` 内部スクロールとは別扱い）。Markdown 本文（見出し/コード/引用/箇条/表/画像）を btop 調にスタイルし、タグリンク・シェアリンク・Nostalgic コメント欄・前後ナビ・関連記事を出す。
- **一覧** `posts.html`（`/posts/`）: 新しい順に 日付＋タイトル＋タグ。タグ一覧 `/tags/`、年別アーカイブ `/archive/`、Atom への導線を上部に置く。ポータルの blog パネルからは `all posts →` で飛ぶ。
- **タグ**: Zola taxonomy は `tags` のみ。カテゴリは作らない。タグ一覧は `/tags/`、タグ別は `/tags/{name}/`（日本語は `/ja/tags/{name}/`）。Zola が URL を小文字化するため `FF14` は `/ja/tags/ff14/`。
- **年別アーカイブ**: `/archive/` は `posts` セクションを年ごとにまとめるだけの時系列ナビ。カテゴリ分類ではない。
- **関連記事**: 同じタグを持つ記事から最大5件を表示する。タグなし・重複なしなら出さない。
- **シェア**: 記事末尾に X / Hatena / LINE / Threads / Bluesky のテキストリンクを出す。外部スクリプトは使わない。
- **コメント**: avel と同じ Nostalgic BBS 画像コメント欄。`scripts/sync-nostalgic-bbs.mjs` が記事の最終URLごとに BBS を lookup/create し、公開IDを `data/nostalgic_bbs.toml` に保存する。記事ページには token を出さず、画像クリックで Nostalgic の投稿ページへ移動する。
- **blog パネル**（`index.html` 中段）: 表示言語の `get_section`（`posts/_index[.{lang}].md`）から**最新5件**を列挙。記事ゼロの言語は `blog_empty`。
- **言語ポリシー（緩さ優先）**: 記事は**日本語で書き、気が向いたものだけ翻訳**する。**4言語そろえる義務は作らない**（apps の products.json と違い完備を強制しない）。日本語だけの記事（`{slug}.ja.md` のみ・`{slug}.md` 無し）は **Zola 標準どおり `/ja/` にだけ出る**（英語ルート `/` には出ない）。統合フォールバックは自作しない＝フレームワークの素の per-language 挙動に乗る。`tests/posts-content.test.js` は**翻訳完備を検証せず**、存在する各記事に `title`/`date` があることだけ守る。

コメント同期:

```bash
cd zola
# 既存IDだけ使う通常ビルド（tokenなしでも壊れない）
node scripts/sync-nostalgic-bbs.mjs && zola build

# 新記事追加後にコメント欄IDを作る
NOSTALGIC_TOKEN=<kako-jun token> node scripts/sync-nostalgic-bbs.mjs
```

大量記事で Nostalgic 側の rate limit に当たらないよう、同期スクリプトは `batchLookup` を小分けし、BBS 作成時は待機＋429/503 リトライを行う。調整用 env: `NOSTALGIC_LOOKUP_LIMIT` / `NOSTALGIC_CREATE_DELAY_MS`。

### Lodestone / FF14 過去記事移植（#33）

`freeza/input/lodestone_complete_export.zip` は `scripts/import-lodestone.mjs` で Zola 記事へ変換する。

```bash
cd zola
node scripts/import-lodestone.mjs
```

- 記事ファイル: `content/posts/lodestone-ayumi-{n}.ja.md`（日本語記事として `/ja/posts/.../` に出す）
- 画像ファイル: `static/images/ff14/`
- 本文の画像 URL: `/images/ff14/{filename}`
- tag: 全記事 `FF14`
- Lodestone export 末尾の `## Comments` 以降は移植しない

画像置き場は移植元名ではなくカテゴリ名で揃える。FF14 系の過去記事画像は今後も `images/ff14` に集約する。

## テーマトグル（#9）

ライト/ダークの手動切替＋ OS 追従。パレットは DESIGN.md の light 値（bg #fff・text #000・緑 #218838・link #007bff 等）。

- **仕組み**: 全自己完結テンプレ（index/post/posts/app/404）の `<head>` で共通パーツ `templates/_theme.html` を include。`:root` はダーク既定、`@media (prefers-color-scheme: light) :root:not([data-theme="dark"])` で OS ライトに自動追従、`:root[data-theme="light"]` で手動上書き。パレットは config.extra の `*_light` 7色から注入。
- **白フラッシュ防止**: `_theme.html` のインライン script が paint 前に `localStorage('llll-theme')` を `<html data-theme>` へ反映。保存が無ければ CSS の prefers-color-scheme に委ねる（既定ダーク）。
- **トグル UI**: index の langbar **左端**（`margin-right:auto` で言語は右のまま）。`static/js/theme-toggle.js` が `data-theme` 反転＋localStorage 保存＋アイコン（☀/☾）/aria 更新。
- **BBS 連動**（kako-jun）: ライト時 `<nostalgic-bbs theme="light">`／ダーク時 `theme="retro"`。島が現テーマに合わせて属性を切替。
- **フッタ背景**: 金沢駅オーバーレイをテーマ追従（ダーク=暗幕 `rgba(18,18,18,.74-.82)`／ライト=白幕 `rgba(255,255,255,.66-.80)`）で、どちらでも文字が読めるように。
- 純粋ロジック（`resolveTheme`/`nextTheme`/`bbsThemeFor`/`iconFor`）を export し `tests/theme-toggle.test.js` で検証。
- **PE**: JS 無効でも ☾ ボタンが無反応で残るだけ。配色は CSS（既定ダーク／prefers-light は自動ライト）で効く。
- follow-up: トグル本体は index langbar のみ（テーマは localStorage で全ページ追従）。post 等への設置は別途。

## ヘッダ Tetris（#7）

header パネルの背面で遊べる Tetris（React 版 `src/lib/tetris.ts` ＋ `useTetrisGame` を素 JS へ移植）。

- `static/js/tetris.js` がプレイフィールド `.panel-header .tetris-bg`（inset:0 で panel 全面）を実描画化。ブロックは panel 背面（z-index 0・`--border` 緑・opacity 0.45）に下から積み、ロゴ/タグライン/本文は前面（z-index 1）で読めるまま。
- **操作**: panel クリックでその列に投下 → 落下して最下段の積み帯に着地 / ブロッククリックで消滅（`tetrisShrink` 0.4s）＋上のブロックは落下（カスケード）。一定間隔で自動スポーン。**列が `MAX_STACK`(3) を超えるとグリッド全体をリセット**（行揃いは grid 幅が広く実際には起きないので、これが実質の片付け）。
- **積み帯の直上から落とす**: React 版はヘッダ高＝積み帯高だったが、こちらは panel が高い（~215px）。パネル全高を漂わせると本文上を 7s 横切り間延びするので、`spawnGridY()` で最下段 `GRID_HEIGHT` 行の1段上から短く（~2s）落とす。panel 高さは mypace/daily の非同期ロードで揺れるため、各 tick で `getBoundingClientRect().height` を読み直して下端追従する。
- **PE**: JS 無効/失敗なら `.tetris-bg` は破線帯＋"tetris" ラベルのまま（壊れない）。JS 起動時に `.tetris-live` を付けてプレースホルダ表示を消し、実描画へ切替。
- **性能/堅牢性**: `tick()` は落下中ブロックが無ければ即 return（固定ブロックは静止＝毎フレーム描き直さない・常時アイドルの reflow/DOM 再生成を回避）。高さ変化（mypace/daily の非同期ロードで panel 高が変わる）への追従は `ResizeObserver` で field サイズ変化時だけ再描画。クリック消去は pixel 逆算でなく固定ブロックの `data-col/data-row` を読む（高さ変化で誤判定しない）。
- **a11y**: 装飾なので `.tetris-bg` は `aria-hidden`。`prefers-reduced-motion` 時は自動スポーンを止める（クリック投下は残す）。
- 純粋ロジック（`createEmptyGrid`/`placeBlock`/`findCompletedRows`/`clearRowsAndCollectFalling`/`removeBlockAndCascade` 等）を `module.exports` で export し `tests/tetris.test.js` で検証（移行元 `src/lib/tetris.test.ts` と同観点）。

## SEO / OGP / フィード（#11）

- **共通 include `templates/_seo.html`**: 各テンプレが `og_title`/`og_desc`/`og_url`（任意で `og_type`/`og_image`）を set して include。canonical＋完全 OG（type/title/description/url/site_name/locale/image）＋Twitter Card（summary_large_image）を出す。`og:image` 既定＝金沢駅 `footer-bg.webp`（絶対URL）、`og:locale` は lang→`xx_XX` 簡易マップ。
- **per-page**: index（website）/ posts（website）/ post（article＋`article:published_time`）/ app（per-app・スクショ画像）/ 404（`robots: noindex`）。
- **JSON-LD**: index=WebSite＋Person(kako-jun)、post=BlogPosting（headline/datePublished/author/publisher/image/inLanguage）、app=SoftwareApplication。すべて妥当な JSON（ビルド生成物を parse 確認）。
- **hreflang**: home に en/ja/zh/es＋x-default の alternate。
- **sitemap.xml**: Zola 既定で全言語/全ページ（104 loc）。
- **Atom フィード**: `config.generate_feeds=true` + `feed_filenames=["atom.xml"]`、posts `_index*.md` に `generate_feeds=true` → 言語別 `/[{lang}/]posts/atom.xml`。head に autodiscovery link。
- **robots.txt**: `static/robots.txt`（Allow: / ＋ Sitemap 参照）。
- 旧 `/ogp.png` フォールバック（実体なし＝404）は `footer-bg.webp` に是正。

## デザイン（黒×緑・btop）

- 一番外枠＝緑ボーダー（`#34d058`）の btop ウィンドウ。デスクトップは `100vh` 固定、apps パネルだけ内部スクロール（緑スクロールバー）、footer 固定。
- palette: bg `#121212` / panel `#1e1e1e` / 枠・アクセント `#34d058` / 文字 `#fff` / muted `#b0b0b0` / link `#60a5fa` / border `#404040`。monospace ベース（DESIGN.md 準拠）。
- スマホ（≤600px）は `100vh` 固定を解除し全パネル縦積み＋普通スクロール。

## フェーズ（Issue #2）

- **Phase 0（#3・このコミット）**: 緑パネルの骨組み＋全20件グリッド・静的・ja のみ。フィルタ/Tetris/カウンタ/日替わり絵は**ガワ・プレースホルダのみ**。
- Phase 1: フィルタ＆検索（#4）・i18n 4言語（#5）・詳細ポップアップ+per-app URL（#13）
- Phase 2: 日替わり絵（#6）・Tetris（#7）・カウンタ/BBS/mypace（#8）・テーマトグル（#9）
- Phase 3: ブログ統合（#10・**第一弾済み**: posts セクション＋記事/一覧テンプレ＋blog パネル＋サンプル3本。タグ別/年別/関連は follow-up）・SEO/OGP（#11）
- Phase 4: デプロイ切替 CF Pages（#12）・avel panel 昇格（avel#18）
