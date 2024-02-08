const fetch = require('node-fetch');
const axios = require('axios');
const { IncomingWebhook } = require('@slack/webhook');
const { Translate } = require('@google-cloud/translate').v2;

// APIキーとSlackの設定
const slackWebhookUrl = "https://hooks.slack.com/services/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";
const slackChannel = "C05L1M7JC8L"; // 投稿するSlackのチャンネルを指定
const googleApiKey = 'AIzaSyD4HQ7xyXcmLCFkcpYo8ve-R6fxSB1H1HY';
const newsdataiokey = 'pub_2718615567c2ba610970ca8b24acdb7eba883';

var countArticle = 0;

const slack = new IncomingWebhook(slackWebhookUrl);

const sourceLanguage = "ka";
const targetLanguage = "ja";

function truncateString(str, maxLength) {
  if (str.maxLength <= maxLength) {
    return str;
  } else {
    return str.slice(0, maxLength - 3) + '...';
  }
}

//引数で受け取った文字列を特定の言語に翻訳
async function translateText(str, sourceLang, targetLang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}&q=${encodeURIComponent(str)}&source=${sourceLang}&target=${targetLang}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText;
    } else {
      throw new Error('Error: Failed to translate the text');
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

// ニュース取得とSlackへの投稿
async function getAndPostNews() {
  try {
    // newsdata.ioからニュースを取得
    const newsUrl = `https://newsdata.io/api/1/news?country=ge&apikey=${newsdataiokey}`;
    const response = await axios.get(newsUrl);
    const results = response.data.results;

    for (const result of results) {
      const title = result.title;
      const description = truncateString(result.description, 200);
      const link = result.link;

      // タイトルと説明を翻訳
      const translatedTitle = await translateText(title, sourceLanguage, targetLanguage);
      const translatedDescription = await translateText(description, sourceLanguage, targetLanguage);

      // Slackに投稿
      await slack.send({
        channel: slackChannel,
        text: `*${translatedTitle}*\n${translatedDescription}\n${link}`
      });

      countArticle += 1;
    }

    console.log(countArticle + '件の記事をSlackに投稿しました。');
  } catch (error) {
    console.error("エラー:", error.message);
    console.log("Slackの投稿に失敗しました。");
  }
}

// 実行
exports.handler = getAndPostNews();