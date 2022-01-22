// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// 「リッチメニュー」のスプレッドシート
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
  //menus.updateSheet();
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let RichMenus = function() {
    let spreadsheet = SpreadsheetApp.openById(RICHMENUS_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(RICHMENUS_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    this.header = new RichMenu(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.keys = [];
    this.menus = {};
    for(let i in _values){
      this.menus[_values[i][0]] = _values[i][1]
      this.keys.push(_values[i][0]);
    }

  };

//リッチメニューのコマンド一覧を配列で返す
　RichMenus.prototype.getMenusList = function(){
    return Object.keys(this.menus);
  };

//リッチメニューの応答文を返す。
//要求するリッチメニューをパラメータで指定する。
//パラメータの文字列が100文字を超えたらnullを返す。
//応答文が無かったらnullを返す。
  RichMenus.prototype.getReturnText = function(richMenu){
    if (richMenu === null || richMenu === undefined || richMenu === ''){
      return null;
    }
    if (richMenu.length > 100 ){
      return null;
    }
    return this.menus[richMenu];
  };

//リッチメニューの応答文を更新する。
  RichMenus.prototype.setReturnText = function(richMenu, returnText){
    if (richMenu.length > 100 ){
      return false;
    }
    if (this.menus[richMenu] === 'undefined'){
      return false;
    }
    this.menus[richMenu] = returnText;
    return true;
  };

//リッチメニューの応答文をスプレッドシートに反映する。
  RichMenus.prototype.updateSheet = function(){
    this.sheet.getDataRange().clearContent();
    this.sheet.appendRow([this.header.richMenu,
                         this.header.returnText]);
    for (let i in this.keys){
      this.sheet.appendRow([this.keys[i],
                           this.menus[this.keys[i]]]);
    }
  };

  global.RichMenus = RichMenus;
})(this);

(function(global){
  let RichMenu = function(record) {
    [this.richMenu,
    this.returnText] = record;
  };

  global.RichMenu = RichMenu;
})(this);
