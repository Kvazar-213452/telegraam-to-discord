const express = require('express');
const fs = require('fs');
const path = require('path');

// Створюємо сервер
const app = express();
const port = 3000;

// Використовуємо middleware для роботи з JSON-даними
app.use(express.json());

// Маршрут для прийому POST-запитів
app.post('/', (req, res) => {
    const data = req.body;

    // Форматуємо дані у рядок
    const dataString = JSON.stringify(data, null, 2);

    // Шлях до файлу
    const filePath = path.join(__dirname, 'h.j');

    // Додаємо отримані дані у файл
    fs.appendFile(filePath, `${dataString}\n`, (err) => {
        if (err) {
            console.error('Помилка при записі у файл:', err);
            return res.status(500).send('Сталася помилка при збереженні даних');
        }

        console.log('Дані успішно збережено у файлі h.j');
        res.send('Дані успішно отримані і збережені');
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});
