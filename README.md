# LINE_BOT_TOBA

https://github.com/igapon50/LINE_BOT_TENSOU
にリッチメニューとその応答処理を追加した。
ただし、[リッチメニューはグループでは使えない](https://teratail.com/questions/271435)ので、botとの1対1トークで利用すること。

botとの1対1トークの場合は、以下の通りリッチメニューが表示され、EMail転送はされない。
![スマホ画面01](https://user-images.githubusercontent.com/14619288/122577026-49ad6a80-d08d-11eb-8169-a4c946a18ca7.jpg)
![スマホ画面02](https://user-images.githubusercontent.com/14619288/122577061-53cf6900-d08d-11eb-990d-541553c87d54.jpg)

botとの1対1トーク以外(=グループトークとトークルーム)の場合は、リッチメニューは表示されないが、メニューの文字列を送ればbotの応答が得られ、EMail転送はされる。
