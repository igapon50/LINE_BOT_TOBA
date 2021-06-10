// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// LINE_BOT_TOBAの「スプレッドシート」
const TOBARICHMENUS_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('TOBARICHMENUS_SPREADSHEET_ID');
const TOBARICHMENUS_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('TOBARICHMENUS_SHEET_NAME');

function myTobaRichMenusTest() {
  let menus = new TobaRichMenus();
  console.log(menus);
  console.log(menus.menus['日程情報']);
  console.log(menus.menus['次回予報']);
  console.log(menus.menus['次回参加者']);
  console.log(menus.menus['次回未記入者']);
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
  console.log(menus.getReturnText('次回'));
  console.log(menus.getReturnText('1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'));
  //menus.setReturnText('日程情報', 'テストsetReturnText');
  //console.log(menus.getReturnText('日程情報'));
  //menus.updateSheet();
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let TobaRichMenus = function() {
    let spreadsheet = SpreadsheetApp.openById(TOBARICHMENUS_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(TOBARICHMENUS_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    this.header = new TobaRichMenu(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.keys = [];
    this.menus = {};
    for(let i = 0; i < _values.length; i++){
      this.menus[_values[i][0]] = _values[i][1]
      this.keys.push(_values[i][0]);
    }

  };

//リッチメニューの応答文を返す。
//要求するリッチメニューをパラメータで指定する。
//パラメータの文字列が100文字を超えたらnullを返す。
//応答文が無かったらnullを返す。
  TobaRichMenus.prototype.getReturnText = function(richMenu){
    if (richMenu.length > 100 ){
      return null;
    }
    if (this.menus[richMenu] === 'undefined'){
      return null;
    }
    return this.menus[richMenu];
  };

//リッチメニューの応答文を更新する。
  TobaRichMenus.prototype.setReturnText = function(richMenu, returnText){
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
  TobaRichMenus.prototype.updateSheet = function(){
    let range = this.sheet.getDataRange().clearContent();
    this.sheet.appendRow([this.header.richMenu,
                         this.header.returnText]);
    for (let i = 0; i < this.keys.length; i++){
      this.sheet.appendRow([this.keys[i],
                           this.menus[this.keys[i]]]);
    }
  };

  global.TobaRichMenus = TobaRichMenus;
})(this);

(function(global){
  let TobaRichMenu = function(record) {
    [this.richMenu,
    this.returnText] = record;
  };

  global.TobaRichMenu = TobaRichMenu;
})(this);
