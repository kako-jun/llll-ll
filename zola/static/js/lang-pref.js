// 言語切替の記憶（#41）。langbar の言語リンクをクリックしたら、その言語を localStorage('llll-lang')
// に同期保存する（遷移前に同期実行）。これにより英語ルート(/) の自動転送が次回その言語を尊重する。
// 例: ja を保存している人が「en」を押す → en を保存 → 以後ルートは英語のまま留まれる。
(function () {
  var links = document.querySelectorAll('.langbar a.lang[data-lang]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function (e) {
      try { localStorage.setItem('llll-lang', e.currentTarget.getAttribute('data-lang')); } catch (err) {}
    });
  }
})();
