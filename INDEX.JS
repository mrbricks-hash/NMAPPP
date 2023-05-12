const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const EmailValidator = require('email-validator');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const bot = new TelegramBot('5871264620:AAHzJB0P1vEDue0NCEY8DwNbC335PQokoAE', { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = '🎩👋 Welcome to Blackhat\'s Nmapper!';
  const startMessage = '🔮 Push start to work magic.';
  const options = {
    reply_markup: {
      inline_keyboard: [[{ text: 'Start', callback_data: 'start' }]],
    },
  };

  bot.sendMessage(chatId, welcomeMessage);
  bot.sendMessage(chatId, startMessage, options);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (query.data === 'start') {
    bot.sendMessage(chatId, '🎯 Enter the target website you\'d like to map:');
    bot.onReplyToMessage(chatId, messageId, async (msg) => {
      const targetWebsite = msg.text.trim();

      try {
        const emailList = [];
        const urlSet = new Set();
        const baseURL = new URL(targetWebsite);

        const processPage = async (pageUrl) => {
          try {
            const response = await axios.get(pageUrl);
            const $ = cheerio.load(response.data);

            $('a[href^="mailto:"]').each((index, element) => {
              const email = $(element).attr('href').replace('mailto:', '');
              if (EmailValidator.validate(email)) {
                emailList.push(email);
              }
            });

            $('a').each((index, element) => {
              const href = $(element).attr('href');
              if (href && !href.startsWith('mailto:') && !urlSet.has(href)) {
                const absoluteURL = new URL(href, pageUrl);
                if (absoluteURL.hostname.endsWith(baseURL.hostname)) {
                  urlSet.add(href);
                  processPage(absoluteURL.href);
                }
              }
            });
          } catch (error) {
            console.error(`Error while scraping ${pageUrl}:`, error);
          }
        };

        processPage(targetWebsite);

        const resultMessage = emailList.length > 0 ? `✉️ Found ${emailList.length} emails:\n\n${emailList.join('\n')}` : '❌ No emails found.';
        bot.sendMessage(chatId, resultMessage);
      } catch (error) {
        console.error('Error while scraping emails:', error);
        bot.sendMessage(chatId, '❌ Error occurred while scraping emails.');
      }
    });
  }
});
