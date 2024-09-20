const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Токен вашого Telegram бота
const token = '7663786653:AAH4neWHUNntiQgUhhfFC-txBtuJjbvcii0';
// ID чату, з якого копіюються повідомлення
const chatId = -4532154352;
// Адреса сервера для POST-запитів
const serverUrl = 'http://localhost:3000/';

// Створюємо бота
const bot = new TelegramBot(token, { polling: true });

// Функція для відправки POST-запиту
async function sendToServer(data) {
    try {
        const response = await axios.post(serverUrl, data);
        console.log('Дані відправлено успішно:', response.data);
    } catch (error) {
        console.error('Помилка при відправці на сервер:', error);
    }
}

// Обробка текстових повідомлень
bot.on('message', async (msg) => {
    if (msg.chat.id === chatId) {
        // Відправляємо текстове повідомлення на сервер
        const data = {
            message: msg.text || '', // Текст повідомлення
            userId: msg.from.id,     // ID користувача, який надіслав повідомлення
            userName: msg.from.username || msg.from.first_name, // Ім'я користувача
        };

        await sendToServer(data);
    }
});

// Обробка повідомлень із фото
bot.on('photo', async (msg) => {
    if (msg.chat.id === chatId) {
        const photoArray = msg.photo;
        const fileId = photoArray[photoArray.length - 1].file_id; // Беремо найбільше зображення

        // Отримуємо посилання на фото
        const fileLink = await bot.getFileLink(fileId);

        // Відправляємо фото на сервер
        const data = {
            photoUrl: fileLink,
            userId: msg.from.id,
            userName: msg.from.username || msg.from.first_name,
        };

        await sendToServer(data);
    }
});

console.log('Бот запущено...');
