//参考にしたサイト
//https://note.com/luth/n/ne6d340cec623
//LINEドキュメント リッチメニュー
//https://developers.line.biz/ja/reference/messaging-api/#rich-menu
//以下の変数を前提としている
//同じスクリプトプロジェクト内に記述
const URL_RICHMENU = 'https://api.line.me/v2/bot/richmenu';
const URL_RICHMENU_DATA = 'https://api-data.line.me/v2/bot/richmenu/';
const URL_RICHMENU_USER_ALL = 'https://api.line.me/v2/bot/user/all/richmenu';

//翔波グループ用リッチメニュー画像
const DRIVE_FILE_ID = PropertiesService.getScriptProperties().getProperty('DRIVE_FILE_ID');

//リッチメニュー画像は、
//以下の画像結合ツールを使用して4分割画像を作り、
//https://photocombine.net/cb/
//以下の地紋ツールを使用して作成した。
//https://photocombine.net/watermark/

//デフォルトリッチメニューのIDを取得する
// function Test_myGetDefaultRichMenu(){
//   let richMenuID = getDefaultRichmenu();
//   console.log(richMenuID);
//   return richMenuID;
// }

//メニューを取得する
function Test_myGetRichMenu(){
  let richMenuID = getRichmenus();
  console.log(richMenuID);
  return richMenuID;
}

/**
 * リッチメニューを作って、確認して、画像を上げて、リッチメニューを削除する
 * GoogleDriveに格納している画像ファイルを、JPEGファイルとしてアップロードする
 * ※GoogleDriveのファイルIDはファイルの共有リンクにあります
 * 「https://drive.google.com/file/d/<ファイルID>/view?usp=sharing」
 * 「https://drive.google.com/open?id=<ファイルID>」
 * 
 * @return {Object} json - 結果
 */
function myMakeRichMenu(){
  let richMenuID = makeRichmenu_1200x810in4Size();
  console.log(richMenuID);
  let richMenus = getRichmenus();
  console.log(richMenus);
  let result = setImage_Richmenu_Jpeg(richMenuID, DRIVE_FILE_ID);
  console.log(result);
  return result;
}

//作成済みのリッチメニューの一つ目をデフォルトに登録する
function mySetDefaultRichMenu(){
  let richMenus = getRichmenus();
  console.log(richMenus);
  let richMenuID = richMenus.richmenus[0].richMenuId;
  result = setDefaultRichmenu(richMenuID);
  console.log(result);
  return result;
}

//作成済みのリッチメニューの一つ目を削除する
function myDelRichMenu(){
  let richMenus = getRichmenus();
  console.log(richMenus);
  let richMenuID = richMenus.richmenus[0].richMenuId;
  result = deleteRichmenu(richMenuID);
  console.log(result);
  return result;
}

/**
 * リッチメニューを作成し、固有IDを返す
 * タップ領域は、全体1200*810px、4分割
 * 
 * @return {Object} json.richMenuId - LINEから返されたリッチメニュー固有のID
 */
function makeRichmenu_1200x810in4Size() {
  let url = URL_RICHMENU;
  let areas = [];

  //タップ領域　その1
  areas[0] = {
    //領域の大きさ
    'bounds': {

      //左から0px地点から
      'x': 0,

      //上から0px地点から
      'y': 0,

      //幅600px
      'width': 619,

      //高さ405px
      'height': 397,
    },

    //ユーザがタップ時のアクション
    'action': {
      //メッセージアクション
      'type': 'message',

      //ユーザがタップ時に、botへ送信する内容
      'text': '次回予報',
    }
  };

  areas[1] = {
    //領域の大きさ
    'bounds': {

      //左から600px地点から
      'x': 625,

      //上から0px地点から
      'y': 0,

      //幅600px
      'width': 575,

      //高さ405px
      'height': 397,
    },

    //ユーザがタップ時のアクション
    'action': {
      //メッセージアクション
      'type': 'message',

      //ユーザがタップ時に、botへ送信する内容
      'text': '日程情報',
    }
  };

  areas[2] = {
    //領域の大きさ
    'bounds': {

      //左から0px地点から
      'x': 0,

      //上から0px地点から
      'y': 402,

      //幅600px
      'width': 605,

      //高さ405px
      'height': 408,
    },

    //ユーザがタップ時のアクション
    'action': {
      //メッセージアクション
      'type': 'message',

      //ユーザがタップ時に、botへ送信する内容
      'text': '次回未記入者',
    }
  };

  areas[3] = {
    //領域の大きさ
    'bounds': {

      //左から600px地点から
      'x': 610,

      //上から405px地点から
      'y': 402,

      //幅600px
      'width': 590,

      //高さ405px
      'height': 408,
    },

    //ユーザがタップ時のアクション
    'action': {
      //メッセージアクション
      'type': 'message',

      //ユーザがタップ時に、botへ送信する内容
      'text': '次回参加者',
    }
  };

  let postData = {
    //タップ領域全体のサイズ
    'size': {

      //幅1200pxで
      'width': 1200,

      //高さ810pxで
      'height': 810,
    },

    //デフォルトのリッチメニューにするかどうか
    'selected': true,

    //リッチメニュー管理用の名前　ユーザには非公開
    'name': 'リッチメニュー',

    //トークルームメニューに表示されるテキスト
    'chatBarText': 'タップするとメニューが出るよ',

    //タップ領域群
    'areas': areas,
  };

  let headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  let options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(postData),
  };

  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
//  console.log(json.richMenuID);
  return json.richMenuId;
}

//引数で指定したリッチメニューを、デフォルトリッチメニューに設定する
function setDefaultRichmenu(richMenuID) {
  let url = URL_RICHMENU_USER_ALL + '/' + richMenuID;

  let headers = {
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  let options = {
    'method': 'post',
    'headers': headers,
  };

  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
//  console.log(json);
  return json;
}

//デフォルトリッチメニューIDを取得する
// function getDefaultRichmenu() {
//   let url = URL_RICHMENU_USER_ALL;

//   let headers = {
//     'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
//   };

//   let options = {
//     'method': 'get',
//     'headers': headers,
//   };

//   let json = UrlFetchApp.fetch(url, options);
//   json = JSON.parse(json);
//   console.log(json.richMenuID);
//   return json.richMenuID;
// }

/**
 * 作成済リッチメニューに画像ファイルを紐づけ
 * GoogleDriveに格納している画像ファイルを、JPEGファイルとしてアップロードする
 * ※GoogleDriveのファイルIDはファイルの共有リンクにあります
 * 「https://drive.google.com/file/d/<ファイルID>/view?usp=sharing」
 * 「https://drive.google.com/open?id=<ファイルID>」
 * 
 * @param {string} richmenuId - リッチメニュー固有のID
 * @param {string} drive_fileId - GoogleDriveのファイルID
 * @return {Object} json - 結果
 */
function setImage_Richmenu_Jpeg(richmenuId, drive_fileId) {
  let url = URL_RICHMENU + '/' + richmenuId + '/content';

  //GoogleDriveからファイルIDで画像ファイルを開く
  let image = DriveApp.getFileById(drive_fileId);

  //開いた画像ファイルをJPEG形式・BLOBに変換
  let blob = image.getAs(MimeType.JPEG);

  let headers = {
    'Content-Type': 'image/jpeg',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  let options = {
    'method': 'post',
    'headers': headers,

    //payloadにBLOBをそのまま乗せる
    'payload': blob,
  };

  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
//  console.log(json);
  return json;
}

/**
 * MessagingAPIから作成したリッチメニューを取得
 * 
 * @return {Object} json - 取得したリッチメニュー一覧
 */
function getRichmenus() {
  let url = URL_RICHMENU + '/list';

  let headers = {
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  let options = {
    'method': 'get',
    'headers': headers,
  };

  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
//  console.log(json);
  return json;
}

/**
 * リッチメニューを削除
 * 特定ユーザに紐づけている場合は、ユーザが再度トークルームに入室した際に反映
 * 
 * @param {string} richmenuId - リッチメニュー固有のID
 * @return {Object} json - 結果
 */
function deleteRichmenu(richmenuId) {
  let url = URL_RICHMENU + '/' + richmenuId;

  let headers = {
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  let options = {
    'method': 'delete',
    'headers': headers,
  };

  let json = UrlFetchApp.fetch(url, options);
  json = JSON.parse(json);
//  console.log(json);
  return json;
}