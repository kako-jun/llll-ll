+++
title = "このサイトのカウンタと掲示板について（Nostalgic）"
date = 2026-06-13

[taxonomies]
tags = ["nostalgic", "about"]

[extra]
tags = ["nostalgic", "about"]
+++

このサイトの訪問カウンタ（上の visits バー）と、各ブログ記事の下のコメント欄は、**Nostalgic** という仕組みで動いています。

## Nostalgic とは

Nostalgic は、昔ながらのアクセスカウンタ・いいね・ランキング・掲示板（BBS）を、**自前のサーバを持たない静的サイトにも置けるようにする無料サービス**です。kako-jun が作りました。カウンタや掲示板は「URL ＋ 合言葉（token）」のペアでひとつずつ識別され、ページに小さなコードを貼るだけで使えます。

- 本体・使い方: <https://nostalgic.llll-ll.com/>

## なぜ使っているか

企画42課（このサイト）は [Zola](https://www.getzola.org/) で作った静的サイトで、自前のデータベースやサーバを持っていません。それでも「何人が訪れたか」を見せたり、「ひとことコメントを残せる」ようにしたくて、Nostalgic を使っています。

- **訪問カウンタ**: 上の visits バーの Total / Today / Yesterday / Week / Month は、Nostalgic の訪問カウンタが返す実数です。
- **コメント欄**: 各記事の下のコメントは、Nostalgic の BBS です。コメントは画像として返ってくるので、JavaScript を切っていても読めます。

## あなたのサイトにも

同じ仕組みは、あなたの静的サイトやブログにも置けます。サーバもデータベースも要りません。気になったら <https://nostalgic.llll-ll.com/> をのぞいてみてください。
