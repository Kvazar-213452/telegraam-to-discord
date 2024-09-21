const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'conf.m');
const bodyParser = require('body-parser');

let discordToken = '';
let telegramToken = '';

async function getFirstLine() {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const lines = data.split('\n');
        telegramToken = lines[0].trim();
        discordToken = lines[1].trim();
    } catch (error) {
        console.error('Помилка при читанні файлу:', error);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Discord бот увійшов як ${client.user.tag}`);
});

const guildId = '1168108607666131006';
const channelId = '1168108608391741512';

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

app.use(express.json());

app.post('/', async (req, res) => {
    const data = req.body;

    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            let messageContent = `
            **TSW_User: ${data.userName}**\n${data.message}\n${data.timestamp}
            `;

            if (data.photoBase64) {
                const imageBuffer = Buffer.from(data.photoBase64, 'base64');
                const imageFileName = `photo_${Date.now()}.png`;

                fs.writeFileSync(imageFileName, imageBuffer);

                const embed = new EmbedBuilder()
                    .setTitle('Фото')
                    .setDescription(messageContent)
                    .setImage(`attachment://${imageFileName}`);

                await channel.send({
                    embeds: [embed],
                    files: [{ attachment: imageFileName }]
                });

                fs.unlinkSync(imageFileName);
                console.log('Повідомлення з зображенням надіслано до Discord');
            } else {
                if (data.message && data.message.trim()) {
                    await channel.send(messageContent);
                    console.log('Текстове повідомлення надіслано до Discord');
                } else {
                    console.log('Повідомлення пусте, не надсилаємо до Discord');
                }
            }

            res.send('Дані успішно отримані та надіслані до Discord');
        } else {
            res.status(404).send('Канал не знайдено');
        }
    } catch (error) {
        console.error('Помилка при надсиланні повідомлення до Discord:', error);
        res.status(500).send('Сталася помилка при надсиланні повідомлення до Discord');
    }
});

app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});

(async () => {
    await getFirstLine();
    
    if (telegramToken) {
        const bot = new TelegramBot(telegramToken, { polling: true });
        const telegramChatId = -1002381034023;
        const serverUrl = 'http://localhost:3000';

        async function sendToTelegram(message) {
            console.log('Відправляємо повідомлення до Telegram:', message);
            try {
                await bot.sendMessage(telegramChatId, message);
                console.log('Повідомлення надіслано до Telegram:', message);
            } catch (error) {
                console.error('Помилка при надсиланні повідомлення до Telegram:', error);
            }
        }

        async function sendPhotoToTelegram(photoUrl, caption) {
            console.log('Відправляємо фото до Telegram:', photoUrl);
            try {
                await bot.sendPhoto(telegramChatId, photoUrl, { caption: caption || '' });
                console.log('Фото надіслано до Telegram:', photoUrl);
            } catch (error) {
                console.error('Помилка при надсиланні фото до Telegram:', error);
            }
        }

        client.on('messageCreate', async (message) => {
            console.log(`Отримано повідомлення: ${message.content}`);
            if (message.channel.id === channelId) {
                if (message.content.startsWith('@@#')) {
                    const contentToSend = message.content.replace('@@#', '').trim();
                    if (message.attachments.size > 0) {
                        const attachment = message.attachments.first();
                        const photoUrl = attachment.url;
                        await sendPhotoToTelegram(photoUrl, contentToSend);
                    } else {
                        await sendToTelegram(contentToSend);
                    }
                }
            }
        });
        
        bot.on('message', async (msg) => {
            if (msg.chat.id === telegramChatId && !msg.photo) {
                const data = {
                    message: msg.text || '',
                    userName: msg.from.username || msg.from.first_name,
                    timestamp: new Date(msg.date * 1000).toISOString()
                };

                try {
                    const response = await axios.post(serverUrl, data);
                    console.log('Дані відправлено до Discord:', response.data);
                } catch (error) {
                    console.error('Помилка при надсиланні даних до Discord:', error);
                }
            }
        });

        bot.on('photo', async (msg) => {
            if (msg.chat.id === telegramChatId) {
                const photoArray = msg.photo;
                const fileId = photoArray[photoArray.length - 1].file_id;

                try {
                    const file = await bot.getFile(fileId);
                    const filePath = file.file_path;
                    const fileUrl = `https://api.telegram.org/file/bot${telegramToken}/${filePath}`;

                    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                    const photoBase64 = Buffer.from(response.data, 'binary').toString('base64');

                    const data = {
                        photoBase64: photoBase64,
                        userId: msg.from.id,
                        userName: msg.from.username || msg.from.first_name,
                        timestamp: new Date(msg.date * 1000).toISOString()
                    };

                    await axios.post(serverUrl, data);
                } catch (error) {
                    console.error('Помилка при обробці фото з Telegram:', error);
                }
            }
        });

        console.log('Telegram бот запущено...');
    } else {
        console.error('Не вдалося отримати токен для Telegram бота');
    }

    if (discordToken) {
        await client.login(discordToken);
    } else {
        console.error('Не вдалося отримати токен для Discord');
    }
})();