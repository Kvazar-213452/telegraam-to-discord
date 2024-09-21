const express = require('express');
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
        const chatId = -1002381034023; // ID чату, куди відправляти повідомлення

        // Ініціалізація Express-сервера
        const app = express();
        const port = 2000;

        app.use(express.json());

        // Обробка POST-запиту для отримання повідомлень
        app.post('/', async (req, res) => {
            const data = req.body;

            try {
                // Обробка текстових повідомлень
                if (data.message) {
                    const messageText = `Повідомлення від ${data.userName}: ${data.message}\nЧас: ${data.timestamp}`;
                    await bot.sendMessage(chatId, messageText);
                    console.log('Текстове повідомлення відправлено до Telegram');
                }

                // Обробка зображень
                if (data.photoBase64) {
                    const imageBuffer = Buffer.from(data.photoBase64, 'base64');
                    const imageFileName = `photo_${Date.now()}.png`;

                    // Зберігаємо тимчасово файл
                    fs.writeFileSync(imageFileName, imageBuffer);

                    // Відправляємо зображення до Telegram
                    await bot.sendPhoto(chatId, imageBuffer, { caption: `Фото від ${data.userName}\nЧас: ${data.timestamp}` });

                    // Видаляємо тимчасовий файл
                    fs.unlinkSync(imageFileName);
                    console.log('Фото відправлено до Telegram');
                }

                res.send('Дані успішно оброблені та відправлені до Telegram');
            } catch (error) {
                console.error('Помилка при обробці даних:', error);
                res.status(500).send('Сталася помилка при відправленні повідомлення до Telegram');
            }
        });

        // Запуск сервера
        app.listen(port, () => {
            console.log(`Сервер запущено на порту ${port}`);
        });

    } else {
        console.error('Не вдалося отримати токен для Telegram бота');
    }
})();
