const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Настройка подключения к PostgreSQL
const pool = new Pool({
    user: 'postgres', // Имя пользователя PostgreSQL
    host: 'localhost', // Хост (пока локально)
    database: 'mmorpg_db', // Имя базы данных (создадим дальше)
    password: '6886', // Замени на твой пароль для PostgreSQL
    port: 5432, // Порт PostgreSQL (обычно 5432)
});

// Тест подключения к базе данных
pool.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к PostgreSQL:', err.stack);
    } else {
        console.log('Подключение к PostgreSQL успешно!');
    }
});

// API для регистрации
app.post('/register', async (req, res) => {
    const { login, password } = req.body;
    try {
        // Проверяем, существует ли пользователь
        const checkUser = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Логин уже занят!' });
        }

        // Регистрируем нового пользователя
        await pool.query('INSERT INTO users (login, password) VALUES ($1, $2)', [login, password]);
        res.status(200).json({ success: true, message: 'Регистрация успешна!' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API для логина
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE login = $1 AND password = $2', [login, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: 'Логин успешен!' });
        } else {
            res.status(401).json({ success: false, message: 'Неверный логин или пароль!' });
        }
    } catch (err) {
        console.error('Ошибка при логине:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});