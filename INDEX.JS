const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const Nmap = require('node-nmap');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const bot = new TelegramBot('YOUR_TELEGRAM_BOT_TOKEN', { polling: true });

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
        const response = await axios.get(targetWebsite);
        const $ = cheerio.load(response.data);

        const emailList = [];
        $('a[href^="mailto:"]').each((index, element) => {
          const email = $(element).attr('href').replace('mailto:', '');
          emailList.push(email);
        });

        const resultMessage = emailList.length > 0 ? `✉️ Found ${emailList.length} emails:\n\n${emailList.join('\n')}` : '❌ No emails found.';
        bot.sendMessage(chatId, resultMessage);
      } catch (error) {
        console.error('Error while scraping emails:', error);
        bot.sendMessage(chatId, '❌ Error occurred while scraping emails.');
      }

      try {
        const nmapScan = new Nmap.NmapScan(targetWebsite);
        nmapScan.on('complete', (data) => {
          const openPorts = data[0].openPorts;
          if (openPorts.length > 0) {
            const resultMessage = `🔍 ${openPorts.length} open port(s) found: ${openPorts.join(', ')}`;
            bot.sendMessage(chatId, resultMessage);
          } else {
            bot.sendMessage(chatId, '❌ No open ports found.');
          }
        });

        nmapScan.startScan();
      } catch (error) {
        console.error('Error occurred while performing Nmap scan:', error);
        bot.sendMessage(chatId, '❌ Error occurred while performing Nmap scan.');
      }
    });
  }
});
