// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// 「グループ名簿」のスプレッドシート
const MEMBER_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('MEMBER_SPREADSHEET_ID');
const MEMBER_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('MEMBER_SHEET_NAME');

function Test_myMembers() {
  let members = new Members();
  console.log(members);
  let lineBotTransferEMaillist = members.getLineBotTransferEMailList();
  console.log(lineBotTransferEMaillist);
  let igarashi = members.members[members.lastRow - 1 - 1];
  let countingYears = igarashi.getCountingYears();
  console.log(countingYears);
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let Members = function() {
    let spreadsheet = SpreadsheetApp.openById(MEMBER_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(MEMBER_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    this.header = new Member(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.members = [];
    for(let i in _values){
      this.members[i] = new Member(_values[i]);
    }

  };

//LINEボット列に値が入っている行のリストを作って返す。
  Members.prototype.getLineBotTransferEMailList = function(){
    let lineBotTransferEMaillist = [];
    let count = 0;
    for(let i in this.members){
      if (this.members[i].lineBotTransferEMail != ''){
        lineBotTransferEMaillist[count++] = this.members[i].lineBotTransferEMail;
      }
    }
    return lineBotTransferEMaillist;
  };

  global.Members = Members;
})(this);

(function(global){
  let Member = function(record) {
    [this.name,
    this.birthday,
    this.age,
    this.licenseDeadline,
    this.smartPhoneEMail,
    this.homeEMail,
    this.smartPhoneNumber,
    this.officeEMail,
    this.homePhoneNumber,
    this.officePhoneNumber,
    this.officeName,
    this.officePostalCode,
    this.officeAddress,
    this.homePostalCode,
    this.homeAddress,
    this.bloodType,
    this.lineBotTransferEMail] = record;
  };

//数え年
// 誕生日前　→　満年齢＋２歳
// 誕生日後　→　満年齢＋１歳
  Member.prototype.getCountingYears = function(){
    let day = new Date();
    return day.getFullYear() - this.birthday.getFullYear() + 2;
  };

  global.Member = Member;
})(this);
