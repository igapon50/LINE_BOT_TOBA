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

// ブラウザでスクリプトのURLにアクセスすると、GETで通知が来る
function doGet(e) {
  let toppage=HtmlService.createTemplateFromFile("index");
  return toppage.evaluate();
}

// LINE bot はPOSTで通知が来る
// リクエストボディ
// https://developers.line.biz/ja/reference/messaging-api/#request-body
function doPost(e) {
  if (!e){
    //引数が未定義ならテスト動作とする
    let reply_token = 'undefined';
    let members = new TobaMembers();
    let mailAddressList = members.getLineBotTransferEMailList();
    console.log(mailAddressList);
    mailAddressList = ['igapon@gmail.com'];
    const userDisplayName = 'イガポン';
    let user_message = '次回予報';
    //let user_message = '日程情報';
    //let user_message = '次回未記入者';
    //let user_message = '次回参加者';
    //let user_message = 'メールに転送されるLINEのメッセージ';
    return procMessage(reply_token, mailAddressList, user_message, userDisplayName);
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
    if (event === null) {
      // LINEプラットフォームから疎通確認のために、Webhookイベントが含まれないHTTP POSTリクエストが送信されることがあります。 この場合も、ステータスコード200を返してください。
      // https://developers.line.biz/ja/reference/messaging-api/#response
      return STATUS_200;
    }
    const type = event.message.type;
    //LINEからTEXT以外が送られた場合
    if (type !== 'text') {
      return STATUS_200;
    }
    const reply_token = event.replyToken;
    //返信用トークンが使えない場合
    if (typeof reply_token === 'undefined') {
      // LINEプラットフォームから送信されるHTTP POSTリクエストは、送受信に失敗しても再送されません。
      return STATUS_200;
    }
    const userID = event.source.userId;
    const userDisplayName = getLINEUserName(userID);
    let user_message = event.message.text;
    let members = new TobaMembers();
    let mailAddressList = members.getLineBotTransferEMailList();
    return procMessage(reply_token, mailAddressList, user_message, userDisplayName);
  }
}

//メッセージプロシージャ
function procMessage(reply_token, mailAddressList, user_message, userDisplayName){
  let bot_message = [];
  //受け取ったメッセージはメールに転送する(メニュー呼び出しメッセージ含む)
  sendEmail(mailAddressList, user_message, userDisplayName + 'の発言');

  //メニュー呼び出し処理
  console.log('--- ' + user_message + ' ---');
  if (user_message === '次回予報') {
    let days = new TobaDays();
    let forcasts = new Forcasts();
    let nextLineBotDay = days.getNextLineBotDay();
    if (nextLineBotDay === null){
      bot_message = user_message + '\n' + '次回予定がありません。';
      console.log('次回予定がありません。');
    }else{
      console.log(nextLineBotDay.day);
      console.log(getDayString(nextLineBotDay.day));
      bot_message = user_message + '\n' + forcasts.getClosestDayForcast(nextLineBotDay.day);
    }
  }else if (user_message === '日程情報') {
    let days = new TobaDays();
    bot_message = user_message + '\n' + days.getLineBotInformation();
  }else if (user_message === '次回未記入者') {
    let days = new TobaDays();
    let nextLineBotDay = days.getNextLineBotDay();
    if (nextLineBotDay === null){
      bot_message = user_message + '\n次回予定がありません。';
    }else{
      let noAnswerMember = nextLineBotDay.getNoAnswerMemberIndexList();
      let noAnswerMemberNamesString = days.getNamesString(noAnswerMember);
      bot_message = user_message + '\n' + noAnswerMemberNamesString;
    }
  }else if (user_message === '次回参加者') {
    let days = new TobaDays();
    let nextLineBotDay = days.getNextLineBotDay();
    if (nextLineBotDay === null){
      bot_message = user_message + '\n次回予定がありません。';
    }else{
      let participantMember = nextLineBotDay.getParticipantMemberIndexList();
      let participantMemberNamesString = days.getNamesString(participantMember);
      bot_message = user_message + '\n' + participantMemberNamesString;
    }
  }else{
    console.log('メニュー以外の応答の時は、ボットはチャットでしゃべらない');
    return STATUS_200;
  }
  //メニュー呼び出しの応答をメールに転送する
  sendEmail(mailAddressList, bot_message , 'LINE bot 翔波ちゃんネルの発言');

  console.log('--- ' + bot_message + ' ---');
  if (!reply_token || reply_token === 'undefined'){
    console.log('メニュー呼び出しに対して、応答したいが返信用トークンがわからない');
    return STATUS_200;
  }
  sendLINE(reply_token, bot_message);

  return STATUS_200;
}
