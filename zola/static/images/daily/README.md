# daily/ — 日替わりトップ絵（today パネル）の画像置き場

ポータルの「今日の絵」パネルに日替わりで表示する正方形イラストを置く。
クライアント側で日付からインデックスを選び、1枚を表示する（#6）。将来 30 枚程度まで増やす想定。

## 命名規約

- ファイル名は **ゼロ詰め連番** `NN.webp`（`01.webp`, `02.webp`, … `30.webp`）。
- 連番＝日めくりの選択インデックス。歯抜けを作らない（順番に足す）。

## 変換設定（忘れないように）

- **フォーマット: webp**
- **サイズ: 640×640**（正方形）
- **品質: 82**
- ソースは正方形前提（ChatGPT 生成は 1254×1254 等の正方形）。正方形でないソースは中央クロップしてから縮小する。

### 追加手順（1枚足すとき）

```bash
# 正方形ソース → 640x640 webp q82
magick "input.png" -resize 640x640 -quality 82 zola/static/images/daily/NN.webp

# 正方形でないソースは中央クロップしてから
magick "input.png" -resize 640x640^ -gravity center -extent 640x640 -quality 82 zola/static/images/daily/NN.webp
```

## タイトル（manifest）

各絵のタイトルは **`zola/data/daily.json`** に持つ（連番ファイルと対応）。表示は『タイトル』の形（鉤括弧つき）。

```json
[{ "file": "01.webp", "title": "情報化社会" }]
```

新しい絵を足したら、`NN.webp` を置き、`daily.json` に `{ "file": "NN.webp", "title": "…" }` を追記する。

## 参考

- 1枚あたり ~110KB 前後（q82・640px）。日に1枚しか読まないので体積は問題にならない。
- 元データ（高解像度 PNG）は freeza 側の `input/` などに保管し、ここには webp だけを置く。
