const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'conf.m');

let token = '';

async function getFirstLine() {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const firstLine = data.split('\n')[0];
        token = firstLine.trim();
        return firstLine;
    } catch (error) {
        console.error('Помилка при читанні файлу:', error);
    }
}

(async () => {
    await getFirstLine();
    if (token) {
        const bot = new TelegramBot(token, { polling: true });

        const chatId = -1002381034023;
        const serverUrl = 'http://localhost:3000';

        async function sendToServer(data) {
            try {
                const response = await axios.post(serverUrl, data);
                console.log('Дані відправлено успішно:', response.data);
            } catch (error) {
                console.error('Помилка при відправці на сервер:', error);
            }
        }

        bot.on('message', async (msg) => {
            if (msg.chat.id === chatId) {
                const data = {
                    message: msg.text || '',
                    userName: msg.from.username || msg.from.first_name,
                    timestamp: new Date(msg.date * 1000).toISOString()
                };

                await sendToServer(data);
            }
        });

        bot.on('photo', async (msg) => {
            if (msg.chat.id === chatId) {
                const photoArray = msg.photo;
                const fileId = photoArray[photoArray.length - 1].file_id;

                const file = await bot.getFile(fileId);
                const filePath = file.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

                const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                const photoBase64 = Buffer.from(response.data, 'binary').toString('base64');

                const data = {
                    photoBase64: photoBase64,
                    userId: msg.from.id,
                    userName: msg.from.username || msg.from.first_name,
                    timestamp: new Date(msg.date * 1000).toISOString()
                };

                await sendToServer(data);
            }
        });

        console.log('Бот запущено...');
    } else {
        console.error('Не вдалося отримати токен для Telegram бота');
    }
})();