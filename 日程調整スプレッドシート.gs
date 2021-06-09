// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// グループ日程調整の「スプレッドシート」
const SCHEDULE_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SCHEDULE_SPREADSHEET_ID');
const SCHEDULE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('SCHEDULE_SHEET_NAME');

function myDaysTest(){
  let days = new TobaDays();
  console.log(days);
  let list = days.getLineBotList();
  console.log(list);
  let lineBotInformation = days.getLineBotInformation();
  console.log(lineBotInformation);
  let nextLineBotDay = days.getNextLineBotDay();
  if (nextLineBotDay == null){
    console.log('次回予定がありません。');
  }else{
    console.log(nextLineBotDay.day);
    console.log(getDayString(nextLineBotDay.day));
    let noAnswerMember = nextLineBotDay.getNoAnswerMemberIndexList();
    console.log(noAnswerMember);
    let noAnswerMemberNamesString = days.getNamesString(noAnswerMember);
    console.log(noAnswerMemberNamesString);

    let participantMember = nextLineBotDay.getParticipantMemberIndexList();
    console.log(participantMember);
    let participantMemberNamesString = days.getNamesString(participantMember);
    console.log(participantMemberNamesString);
  }
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let TobaDays = function() {
    let spreadsheet = SpreadsheetApp.openById(SCHEDULE_SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SCHEDULE_SHEET_NAME);
    let _values = sheet.getDataRange().getValues();
    this.header = new TobaDay(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.days = [];
    for(let i = 0; i < _values.length; i++){
      this.days[i] = new TobaDay(_values[i]);
    }

  };

//次回のLINEボット列に値が入っている行のインスタンスを返す。
//次回がない時、nullを返す。
  TobaDays.prototype.getNextLineBotDay = function(){
    let count = 0;
    let lineBotList = this.getLineBotList();
    let date_now = new Date();
//    let yesterday = Moment.moment(date_now).subtract(1,'d');
    for(let i = 0; i < lineBotList.length; i++){
      if (Moment.moment(date_now).isAfter(lineBotList[i].day)){
        continue;
      }
      return lineBotList[i];
    }
    return null;
  };

//メンバーインデックスリストから、名前文字列を作成して返す。
  TobaDays.prototype.getNamesString = function(list){
    let stringlist = [];
    let count = 0;
    for(let i = 0; i < list.length; i++){
      stringlist += '　' + this.header.member[list[i]].replace('\n', ' ');
    }
    return stringlist;
  };

//LINEボット列に値が入っている行のリストを作って返す。
  TobaDays.prototype.getLineBotList = function(){
    let daylist = [];
    let count = 0;
    for(let i = 0; i < this.lastRow; i++){
      if (this.days[i].lineBotCtrl != ''){
        daylist[count++] = this.days[i];
      }
    }
    return daylist;
  };

//日程情報文字列を作って返す。
  TobaDays.prototype.getLineBotInformation = function(){
    let stringlist = [];
    let lineBotList = this.getLineBotList();
    let count = 0;
    let date_now = new Date();
//    let yesterday = Moment.moment(date_now).subtract(1,'d');
    for(let i = 0; i < lineBotList.length; i++){
      if (Moment.moment(date_now).isAfter(lineBotList[i].day)){
        continue;
      }
      let week_num = lineBotList[i].day.getDay();
      let week = '(' + ['日', '月', '火', '水', '木', '金', '土'][week_num] + ')';
      stringlist += getDayString(lineBotList[i].day) + '' + 
      week + '' +
      lineBotList[i].eventName + '\n';
    }
    return stringlist;
  };

  global.TobaDays = TobaDays;
})(this);

(function(global){
  let TobaDay = function(record) {
    [this.day,
    this.week,
    this.eventName,
    this.sum,
    this.lineBotCtrl] = record;
    let member = [];
    for (let no = 5; no < record.length; no++){
      member.push(record[no]);
    }
    this.member = member;
  };

//日程調整が参加のメンバーインデックスを返す。
  TobaDay.prototype.getParticipantMemberIndexList = function(){
    let indexlist = [];
    let count = 0;
    for(let i = 0; i < this.member.length; i++){
      if (this.member[i] == '〇' ||
          this.member[i] == '゜' ||
          this.member[i] == '○'){
        indexlist[count++] = i;
      }
    }
    return indexlist;
  };

//日程調整が空欄のメンバーインデックスを返す。
  TobaDay.prototype.getNoAnswerMemberIndexList = function(){
    let indexlist = [];
    let count = 0;
    for(let i = 0; i < this.member.length; i++){
      if (this.member[i] == ''){
        indexlist[count++] = i;
      }
    }
    return indexlist;
  };

  global.TobaDay = TobaDay;
})(this);
