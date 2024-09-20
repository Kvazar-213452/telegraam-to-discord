const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'conf.m');

let discordToken = '';

async function getFirstLine() {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const firstLine = data.split('\n')[0];
        discordToken = firstLine.trim();
        return firstLine;
    } catch (error) {
        console.error('Помилка при читанні файлу:', error);
    }
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
    console.log(`Discord бот увійшов як ${client.user.tag}`);
});

(async () => {
    await getFirstLine();
    if (discordToken) {
        await client.login(discordToken);
    } else {
        console.error('Не вдалося отримати токен для Discord');
    }
})();

const guildId = '1168108607666131006';
const channelId = '1168108608391741512';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/', async (req, res) => {
    const data = req.body;

    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            let messageContent = `
            **TSW_User: ${data.userName}\n${data.message}\n- Час: ${data.timestamp}
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
                await channel.send(messageContent);
                console.log('Текстове повідомлення надіслано до Discord');
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