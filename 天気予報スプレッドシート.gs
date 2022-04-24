// スプレッドシートのURLは
// https://docs.google.com/spreadsheets/d/XXXXXXX/edit
// のような形になっています。XXXXXXXの部分がIDになります。
// 「天気予報」のスプレッドシート
const FORECAST_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('FORECAST_SPREADSHEET_ID');
const FORECAST_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('FORECAST_SHEET_NAME');

function Test_myForcasts() {
  //10日予報をtenki.jpから「天気予報」スプレッドシートに取得する処理はトリガー起動しているのでここでは未確認
  let forcasts = new Forcasts();
  console.log(forcasts);
  //10日予報の初日を取得する
  // let forcastString = forcasts.forcasts[0].getForcastString();
  // console.log(forcastString);
  //9日後の天気予報を取得する
  let date_now = new Date();
  let target_day = new Date(date_now.setDate(date_now.getDate() + 9));
  let closestDayForcast = forcasts.getClosestDayForcast(target_day);
  console.log(closestDayForcast);
}

// 即時関数化して、いろいろ見えないようにする
// https://tonari-it.com/gas-class-immediate-function/
(function(global){
  let Forcasts = function() {
    let spreadsheet = SpreadsheetApp.openById(FORECAST_SPREADSHEET_ID);
    this.sheet = spreadsheet.getSheetByName(FORECAST_SHEET_NAME);
    let _values = this.sheet.getDataRange().getValues();
    // this.header = new Forcast(_values[0]);
    _values.shift(); //ヘッダーを削除
    this.lastColumn = this.sheet.getDataRange().getLastColumn();
    this.lastRow = _values.length;
    this.forcasts = [];
    for(let i in _values){
      this.forcasts[i] = new Forcast(_values[i]);
    }
  };

  // 「天気予報」スプレッドシートから指定日予報を読み込んで表示用メッセージを返す。
  // 指定日の予報がない場合、予定がありませんメッセージ
  // 指定日が10日より先で予報がまだない場合、10日以内しか予報がありませんメッセージ
  Forcasts.prototype.getClosestDayForcast = function(compare_day){
    let string_list = [];
    let date_now = new Date();
    let target_day = new Date(date_now.setDate(date_now.getDate() + 11));
    string_list += '\n' + getDayString(compare_day) + FORECAST_SHEET_NAME + "の天気予報";
    string_list += '\n(https://tenki.jp/forecast/4/20/5620/17202/10days.html)';
    if (Moment.moment(compare_day).isAfter(target_day)){
      string_list += "\n次の予定は11日以上先なので、まだ予報が出ていません。";
      return string_list;
    }
    
    // 一行ずつループを回し、日時が指定日と同じかチェックする。
    for (let i in this.forcasts){
      target_day = this.forcasts[i].monthDay;
      let compare = Moment.moment(target_day).isSame(compare_day, 'day');
      if (compare){
        string_list += "\n " + this.forcasts[i].getForcastString();
      }
    }
    return string_list;
  };

  global.Forcasts = Forcasts;
})(this);

(function(global){
  let Forcast = function(record) {
    [this.monthDay,
    this.week,
    this.time,
    this.weather,
    this.prob,
    this.precip,
    this.temp,
    this.windBlow,
    this.windSpeed] = record;
  };

//表示用文字列の作成
  Forcast.prototype.getForcastString = function(){
    let string = [];
    string = 
              // this.getDayString(this.monthDay) + ' ' +
              // this.week + ' ' +
              this.time + ' ' +
              this.weather + ' ' +
              this.prob + ' ' +
              this.precip + ' ' +
              this.temp + ' ' +
              this.windBlow + ' ' +
              this.windSpeed;
    return string;
  };

  global.Forcast = Forcast;
})(this);

// tenki.jpにスクレイピング対策が入ったみたいで、UrlFetchApp.fetchが応答しない。
// User Agentを見ているものと思われるが、変更するすべはなし。
// https://kapiecii.hatenablog.com/entry/2019/05/10/230950#User-Agent%E3%82%92%E5%A4%89%E6%9B%B4%E3%81%99%E3%82%8B
// 天気予報tenki.jpから七尾市和倉町の10日予報の日付、天気、気温、風向、風力をとってきてスプレッドシートに記載する
function getForecastFromUrlToSpreadsheet() {
  //「スプレッドシート」の「七尾市和倉町」
  let spreadsheet = SpreadsheetApp.openById(FORECAST_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(FORECAST_SHEET_NAME);
  //tenki.jpから10日予報取得
  let getUrl = 'https://tenki.jp/forecast/4/20/5620/17202/10days.html';
  let html_all = UrlFetchApp.fetch(getUrl).getContentText('UTF-8');
  //パース
  let html_table = Parser.data(html_all).from('<table class="forecast-point-10days">').to('</table>').iterate();
  let html_list = [];
  for (let i in html_table) {
    let html_list_temp = Parser.data(html_table[i]).from('<tr>').to('</tr>').iterate();
    html_list = html_list.concat(html_list_temp);
  }
  let data_MonthDay = [];
  let data_week = [];
  let data_time = [];
  let data_weather = [];
  let data_temp = [];
  let data_prob = [];
  let data_wind_blow = [];
  let data_windspeed = [];
  //<tr>タグの単位でパースを繰り返す
  for (let tr in html_list) {
    let html = html_list[tr];
    
    //<tr>タグ内の最初の<th>タグに日時があるときcontinue
    let th = Parser.data(html).from('<th>').to('</th>').build();
    if (th.indexOf("日時") !== -1) {
      //trタグ内の最初のthタグ内に、「日時」が見つかったらcontinue
      continue;
    }
    //<tr>タグがヘッダー情報だったら日付だけ取得する
    if (html.indexOf('<td class="time">') === -1) {
      //trタグ内に指定の文字列がなかったら処理しない。
      data_MonthDay.push(Parser.data(html).from('<th>').to('(<span').build());
      data_week.push(Parser.data(Parser.data(html).from('<th>').to('</th>').build()).from('>').to('</span').build());
      continue;
    }
    //時間毎の予報を取得する。
    data_time.push(Parser.data(html).from('<td class="time">').to('</td>').build());
    data_weather.push(Parser.data(Parser.data(html).from('<td class="weather">').to('</td>').build()).from('<span class="forecast-telop">').to('</span>').build());
    data_temp.push(Parser.data(Parser.data(html).from('<td class="temp">').to('</td>').build()).from('<span>').to('&#8451;</span>').build());
    data_prob.push(Parser.data(Parser.data(html).from('<td class="prob-precip">').to('</td>').build()).from('<span>').to('</span>').build());
    data_wind_blow.push(Parser.data(Parser.data(html).from('<td class="wind">').to('</td>').build()).from('alt="').to('" width=').build());
    data_windspeed.push(Parser.data(Parser.data(html).from('<td class="wind">').to('</td>').build()).from('<span class="wind-speed">').to('<span>m/s</span></span>').build());
  }
  
  //スプレッドシートをクリアしてから記載する
  sheet.clear();
  sheet.getRange('B:H').setNumberFormat('@'); //文字列扱いする列=B:H
  //降水確率をsetValueすると数値セルになる。
  //数値セルのままgetValueすると、例えば10%が0.1になってしまう。
  //書式をクリアして文字列の%にしておく。
  let row = 1;
  let count = 0;
  for (let i in data_time) {
    if (data_time[i] == '00-06') {
      if (count !== data_MonthDay.lenght){
        count++;
      }
    }
    let lastRow = sheet.getLastRow() + 1;
    let range = sheet.getRange(lastRow, 1, 1, 8); //列数=8
    range.setValues([[data_MonthDay[count],
                    data_week[count],
                    data_time[i] + '時',
                    data_weather[i],
                    data_prob[i],
                    data_temp[i] + '℃',
                    data_wind_blow[i],
                    data_windspeed[i] + 'm/s']]);
    row++;
  }
  return row;
}
