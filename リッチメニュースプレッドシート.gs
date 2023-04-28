// スプレッドシートのURLは、以下のフォーマットになっています。XXXXXXXの部分がIDになります。
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
const RICHMENUS_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('RICHMENUS_SPREADSHEET_ID');
const RICHMENUS_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('RICHMENUS_SHEET_NAME');

function Test_myRichMenus() {
  let menus = new RichMenus();
  console.log(menus);
  console.log(menus.menus['日程情報']);
  console.log(menus.menus['次回予報']);
  console.log(menus.menus['次回参加者']);
  console.log(menus.menus['次回未記入者']);
  //インジェクションテスト
  console.log(menus.menus['0次回未記入者']); //undefined
  console.log(menus.menus["let '次回未記入者"]); //undefined
  console.log(menus.menus['\\.//?*"次回未記入者']); //undefined
  console.log(menus.menus['1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890']); //undefined
  console.log(menus.menus.日程情報);
  console.log(menus.menus.次回予報);
  console.log(menus.menus.次回参加者);
  console.log(menus.menus.次回未記入者);
  // console.log(menus.menus.次回未.記入者); //エラー
  console.log(menus.menus);
  console.log(menus.getReturnText('日程情報'));
  console.log(menus.getReturnText('次回予報'));
  console.log(menus.getReturnText('次回参加者'));
  console.log(menus.getReturnText('次回未記入者'));
  //インジェクションテスト
  console.log(menus.getReturnText());
  console.log(menus.getReturnText(''));
  console.log(menus.getReturnText('次回'));
  console.log(menus.getReturnText('1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'));
  console.log(menus.getReturnText('12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901'));
  //menus.setReturnText('日程情報', 'テストsetReturnText');
  //console.log(menus.getReturnText('日程情報'));
}

function Test_myRichMenus_2() {
  let menus = new RichMenus();
  console.log(menus);
  menus.setReturnText('日程情報', 'テストsetReturnText');
  console.log(menus.getReturnText('日程情報'))
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let RichMenus = function() {
    let spreadsheet = SpreadsheetApp.openById(RICHMENUS_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(RICHMENUS_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    //一行目は見出しとする。見出し読み込み。
    this.header = new RichMenu(_values[0]);
    _values.shift(); //ヘッダーを削除
    //二行目以降はデータ。データ読み込み
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.keys = [];
    this.menus = {};
    for(let i = 0; i < _values.length; i++){
      this.menus[i] = new RichMenu(_values[i]);
    }
  };

  // リッチメニューの応答文を返す。要求するリッチメニューをパラメータで指定する。パラメータの文字数が100を超えたり、応答文が無かったら''を返す。
  RichMenus.prototype.getReturnText = function(richMenu, limit_length=100){
    if (richMenu === null || richMenu === undefined || richMenu === ''){
      return '';
    }
    if (richMenu.length > limit_length ){
      return '';
    }
    let array = [Object.keys(this.menus), Object.values(this.menus)]
    return array[richMenu];
  };

  // リッチメニューの応答文を更新する。
  RichMenus.prototype.setReturnText = function(richMenu, returnText, limit_length=100){
    if (richMenu.length > limit_length ){
      return false;
    }
    for(let row in this.menus){
      if(this.menus[row].richMenu === richMenu){
        this.menus[row].returnText = returnText;
        this.updateSheet()
        return true;
      }
    }
    return false;
  };

  // 全てのメニューを取得する
  RichMenus.prototype.getValues = function(){
    let values = []
    for(let row in this.menus){
      values.push(this.menus[row].getRow());
    }
    return values;
  };

  // リッチメニューの応答文をスプレッドシートに反映する。
  RichMenus.prototype.updateSheet = function(){
    // 一旦クリア
    this.sheet.clearContents();
    // 見出し反映
    let values = [];
    values.push(this.header.getRow());
    // データの反映
    for(let value of this.getValues()){
      values.push(value);
    }
    //データ範囲の最終行と最終列を求める
    let column = this.header.getRow().length;
    let row = values.length;
    //書き出し
    this.sheet.getRange(1, 1, row, column).setValues(values);
  };

  global.RichMenus = RichMenus;
})(this);

(function(global){
  let RichMenu = function(record) {
    [this.richMenu,
    this.returnText] = record;
  };

  RichMenu.prototype.getRow = function(){
    return [this.richMenu, this.returnText];
  };

  global.RichMenu = RichMenu;
})(this);
