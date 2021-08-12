// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// 「グループ日程調整」のスプレッドシート
const SCHEDULE_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SCHEDULE_SPREADSHEET_ID');
const SCHEDULE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('SCHEDULE_SHEET_NAME');

function mySchedulesTest(){
  let days = new Schedules();
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
  let Schedules = function() {
    let spreadsheet = SpreadsheetApp.openById(SCHEDULE_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(SCHEDULE_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    this.header = new Schedule(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.days = [];
    for(let i in _values){
      this.days[i] = new Schedule(_values[i]);
    }

  };

//次回のLINEボット列に値が入っている行のインスタンスを返す。
//次回がない時、nullを返す。
  Schedules.prototype.getNextLineBotDay = function(){
    let lineBotList = this.getLineBotList();
    let date_now = new Date();
//    let yesterday = Moment.moment(date_now).subtract(1,'d');
    for(let i in lineBotList){
      if (Moment.moment(date_now).isAfter(lineBotList[i].day)){
        continue;
      }
      return lineBotList[i];
    }
    return null;
  };

//メンバーインデックスリストから、名前文字列を作成して返す。
  Schedules.prototype.getNamesString = function(list){
    let stringlist = [];
    for(let i in list){
      stringlist += '　' + this.header.member[list[i]].replace('\n', ' ');
    }
    return stringlist;
  };

//LINEボット列に値が入っている行のリストを作って返す。
  Schedules.prototype.getLineBotList = function(){
    let daylist = [];
    let count = 0;
    for(let i in this.days){
      if (this.days[i].lineBotCtrl != ''){
        daylist[count++] = this.days[i];
      }
    }
    return daylist;
  };

//日程情報文字列を作って返す。
  Schedules.prototype.getLineBotInformation = function(){
    let stringlist = [];
    let lineBotList = this.getLineBotList();
    let count = 0;
    let date_now = new Date();
//    let yesterday = Moment.moment(date_now).subtract(1,'d');
    for(let i in lineBotList){
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

  global.Schedules = Schedules;
})(this);

(function(global){
  let Schedule = function(record) {
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
  Schedule.prototype.getParticipantMemberIndexList = function(){
    let indexlist = [];
    let count = 0;
    for(let i in this.member){
      if (this.member[i] == '〇' ||
          this.member[i] == '゜' ||
          this.member[i] == '○'){
        indexlist[count++] = i;
      }
    }
    return indexlist;
  };

//日程調整が空欄のメンバーインデックスを返す。
  Schedule.prototype.getNoAnswerMemberIndexList = function(){
    let indexlist = [];
    let count = 0;
    for(let i in this.member){
      if (this.member[i] == ''){
        indexlist[count++] = i;
      }
    }
    return indexlist;
  };

  global.Schedule = Schedule;
})(this);
