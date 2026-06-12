+++
title = "歩み76. テレビをつけると蛮神が強くなるバグに遭遇した話"
date = 2022-01-11T11:40:00+09:00

[taxonomies]
tags = ["FF14"]

[extra]
tags = ["FF14"]
+++

Xbox ワイヤレス コントローラー  
[https://www.xbox.com/ja-JP/accessories/controllers/xbox-wireless-controller](https://www.xbox.com/ja-JP/accessories/controllers/xbox-wireless-controller)

でパッドヒーラーをしてます

Xboxのパッドは種類がめっちゃあるけど  
1番新しいやつ

つや消しで十字キーが丸くなってるので区別可能！

このパッドには  
買ったときから2つ問題があって

1つ目はアナログスティック

FF14の設定画面からキャリブレーションしようとすると  
パッドに触れてない状態でも、座標がフラフラしてます

アナログな傾きが  
初期値に戻らないってことです

2つ目の問題が  
時々、3秒～10秒ほど操作不可になること

なにがトリガーなのかずっと謎だったのですが  
FCで以下のURLを教えてもらったところ  
ビンゴでした

[https://jp.finalfantasyxiv.com/lodestone/character/6691203/blog/4871758/](https://jp.finalfantasyxiv.com/lodestone/character/6691203/blog/4871758/)

Windows版FF14でずっと放置されてるバグで  
私だけの現象じゃなかった……

Bluetooth接続のパッドなわけですが  
Windowsが別のBluetooth機器を認識するたびに  
FF14がパッドを見失って操作不可になってたわけです

上記のURLにあるスクリプトで調査したところ  
私の環境では

Xboxのパッドは  
HID 準拠ゲーム コントローラー HID  
という名前で認識され

Microsoft Streaming Service Proxy SW  
と  
\[LG\] webOS TV  
が認識されるたびに固まってました

\[LG\] webOS TVは  
LG製の4Kテレビです

（マイナーなwebOSの機器を、1つ欲しくて買った）

Microsoft Streaming Service Proxy SW  
が何かは分かりませんでした

正確には  
WindowsがBluetooth機器を認識するたび  
だけでなく  
そのBluetooth機器を見失ったときにも固まります

Windowsの認識してるBluetooth機器一覧に  
変化があったタイミングということ

極蛮神中にテレビをつけると  
数秒間ヒールも移動もできずヤバイです

番組がつまらない！  
ってテレビを消してもヤバイです

チャンネルを変えてもつまらないことがあり、大変です

Microsoft Streaming Service Proxy SW  
と似た名前のケースならば  
Windows内のサービスを止めることで  
解決させる情報がありましたが

パッド以外のBluebooth機器も  
普通に使えないと困るので

強力な対策はできなそうです

しかし  
XboxのパッドをUSB-CでPCにつないだところ

当たり前のように  
有線パッドとして認識されたので

大事な戦闘時だけ  
有線で繋ぐので充分そう

という結論になりました

【質問】

Xboxのパッドには  
ミニ四駆用の単3充電池を入れてあり

使い切るたびに  
パッドから取り出して充電器で充電してるのですが

パッドに入れたまま  
USB-Cで接続してれば  
そのうち充電されますか？

それとも危ないので抜いたほうが良いですか？

Microsoft純正のバッテリーならば  
パッドに入れたまま充電するのが  
基本的な使い方みたいですが

普通の充電池でも  
同じことができるのか？

という質問です

【追記】

実際に試したところ、充電されませんでした
