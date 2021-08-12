//■目的
//LINEチャットのメール転送と、リッチメニュー処理を行う。
//■課題
//署名の検証は今のところGASではできない
//■メンテナンス手順
//転送を1h停止する連絡
//→ボットをグループから外す
//→→メールアドレスをバックアップして外し、自分だけにする
//スクリプトを新しいバージョンにする
//スクリプトの応答をボットパークでテストする
//　textで「日程情報？」に応答が返らないこと、メールが1つ転送されること
//　textで「日程情報」に応答が返り、メールが２つ転送されること
//　textで「次回予報」に応答が返り、メールが2つ転送されること
//　imageで応答が返らないこと、メールが転送されないこと
//リッチメニューのテスト
//タップ位置のテスト
//←←メールアドレスのバックアップを元に戻す
//←ボットをグループに入れる
//みんなに転送再開の連絡する

const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
const STATUS_200 = ContentService.createTextOutput(JSON.stringify({'status': 200})).setMimeType(ContentService.MimeType.JSON);

function myBotTest(){
    let user_message;
    // user_message = '日程情報';
    user_message = '次回予報';
    // user_message = '次回未記入者';
    // user_message = '次回参加者';
    let menus = new RichMenus();
    bot_message = menus.getReturnText(user_message);
    console.log(bot_message);
}

// ブラウザでスクリプトのURLにアクセスすると、GETで通知が来る
function doGet(e) {
  let toppage=HtmlService.createTemplateFromFile("index");
  return toppage.evaluate();
}

// LINE bot はPOSTで通知が来る
// リクエストボディ
// https://developers.line.biz/ja/reference/messaging-api/#request-body
function doPost(e) {
  let IsTransferEMailEnabled = true; //true：EMail転送する、false：EMail転送しない
  let reply_token = '';
  let user_message = '';
  let userDisplayName = ''
  if (!e){
    //引数が未定義ならテスト動作とする
    let members = new Members();
    let mailAddressList = members.getLineBotTransferEMailList();
    console.log(mailAddressList);
    mailAddressList = getPropertyArray('TEST_MAILADDRESS');
    user_message = '次回予報';
    // user_message = '日程情報';
    // user_message = '次回未記入者';
    // user_message = '次回参加者';
    // user_message = 'メールに転送されるLINEのメッセージ';
    userDisplayName = 'userDisplayName';
    return procMessage(reply_token, IsTransferEMailEnabled, mailAddressList, user_message, userDisplayName);
  }else{
    const contents = e.postData.contents;

    //現状では、GASのdoPostでリクエストヘッダーを取得する手段がないので、署名の検証ができない。
    //署名の検証
    //https://developers.line.biz/ja/reference/messaging-api/#request-headers
    //GASリファレンス
    //https://developers.google.com/apps-script/guides/web
    //参照記事
    //https://creators-note.chatwork.com/entry/2017/12/20/163128
    // let signature = getSignature(contents);
    // console.log(e.parameter);
    // if (e.parameter.x-line-signature !== signature) {
    //   console.log("Invalid webhook signature!");
    //   return;
    // }

    const event = JSON.parse(contents).events[0];
    if (!event) {
      // LINEプラットフォームから疎通確認のために、Webhookイベントが含まれないHTTP POSTリクエストが送信されることがあります。 この場合も、ステータスコード200を返してください。
      // https://developers.line.biz/ja/reference/messaging-api/#response
      return STATUS_200;
    }
    const type = event.message.type;
    if (type !== 'text') {
      //LINEからTEXT以外が送られた場合
      return STATUS_200;
    }
    reply_token = event.replyToken;
    if (!reply_token) {
      // LINEプラットフォームから送信されるHTTP POSTリクエストは、送受信に失敗しても再送されません。
      return STATUS_200;
    }
    if (event.source.type === 'user'){
      //ユーザー1対1のトークの場合
      IsTransferEMailEnabled = false;
    } else {
      //それ以外(グループトークgroupとトークルームroom)の場合
      IsTransferEMailEnabled = true;
    }
    let members = new Members();
    let mailAddressList = members.getLineBotTransferEMailList();
    user_message = event.message.text;
    const userID = event.source.userId;
    userDisplayName = getLINEUserName(userID);
    return procMessage(reply_token, IsTransferEMailEnabled, mailAddressList, user_message, userDisplayName);
  }
}

//メッセージプロシージャ
function procMessage(reply_token, IsTransferEMailEnabled, mailAddressList, user_message, userDisplayName){
  let bot_message;
  if (IsTransferEMailEnabled){
    //botが受け取ったメッセージはメールに転送する(メニュー呼び出しメッセージ含む)
    sendEmail(mailAddressList, user_message, userDisplayName + 'の発言');
  }

  if (['次回予報','日程情報','次回未記入者','次回参加者'].includes(user_message)){
    let menus = new RichMenus();
    bot_message = menus.getReturnText(user_message);
    if (IsTransferEMailEnabled){
      //botの応答をメールに転送する
      sendEmail(mailAddressList, bot_message , 'LINE bot 翔波ちゃんネルの発言');
    }
    if (reply_token){
      //botの応答をLINEチャットに送る
      sendLINE(reply_token, bot_message);
    }
  }
  return STATUS_200;
}

function updateRichMenuAll() {
  let user_message;
  let bot_message;
  let main_message;
  let days = new Schedules();
  let forcasts = new Forcasts();
  let menus = new RichMenus();
  let nextLineBotDay = days.getNextLineBotDay();

  user_message = '次回予報';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    main_message = forcasts.getClosestDayForcast(nextLineBotDay.day);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  user_message = '日程情報';
  main_message = days.getLineBotInformation();
  bot_message = `${user_message}\n${main_message}`;
  menus.setReturnText(user_message, bot_message);

  user_message = '次回未記入者';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    let noAnswerMember = nextLineBotDay.getNoAnswerMemberIndexList();
    main_message = days.getNamesString(noAnswerMember);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  user_message = '次回参加者';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    let participantMember = nextLineBotDay.getParticipantMemberIndexList();
    main_message = days.getNamesString(participantMember);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  menus.updateSheet();
}

function updateRichMenuNextForcast() {
  let bot_message;
  let user_message;
  let main_message;
  let days = new Schedules();
  let forcasts = new Forcasts();
  let menus = new RichMenus();
  let nextLineBotDay = days.getNextLineBotDay();

  user_message = '次回予報';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    main_message = forcasts.getClosestDayForcast(nextLineBotDay.day);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  menus.updateSheet();
}

function updateRichMenuSchedule() {
  let bot_message;
  let user_message;
  let main_message;
  let days = new Schedules();
  let menus = new RichMenus();

  user_message = '日程情報';
  main_message = days.getLineBotInformation();
  bot_message = `${user_message}\n${main_message}`;
  menus.setReturnText(user_message, bot_message);

  menus.updateSheet();
}

function updateRichMenuNoAnswerMemberNames() {
  let bot_message;
  let user_message;
  let main_message;
  let days = new Schedules();
  let menus = new RichMenus();
  let nextLineBotDay = days.getNextLineBotDay();

  user_message = '次回未記入者';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    let noAnswerMember = nextLineBotDay.getNoAnswerMemberIndexList();
    main_message = days.getNamesString(noAnswerMember);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  menus.updateSheet();
}

function updateRichMenuParticipantMemberNames() {
  let bot_message;
  let user_message;
  let main_message;
  let days = new Schedules();
  let menus = new RichMenus();
  let nextLineBotDay = days.getNextLineBotDay();

  user_message = '次回参加者';
  if (nextLineBotDay === null){
    bot_message = `${user_message}\n次回予定がありません。`;
  }else{
    let participantMember = nextLineBotDay.getParticipantMemberIndexList();
    main_message = days.getNamesString(participantMember);
    bot_message = `${user_message}\n${main_message}`;
  }
  menus.setReturnText(user_message, bot_message);

  menus.updateSheet();
}
