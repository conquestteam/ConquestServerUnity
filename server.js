const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Настройка подключения к PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
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
    console.log('Получен запрос на регистрацию:', req.body);
    const { login, password } = req.body;

    if (!login || !password) {
        console.error('Логин или пароль отсутствуют:', { login, password });
        return res.status(400).json({ success: false, message: 'Логин или пароль отсутствуют' });
    }

    if (typeof login !== 'string' || typeof password !== 'string') {
        console.error('Логин и пароль должны быть строками:', { login, password });
        return res.status(400).json({ success: false, message: 'Логин и пароль должны быть строками' });
    }

    try {
        console.log('Проверка существующего пользователя...');
        const checkUser = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
        console.log('Результат проверки:', checkUser.rows);

        if (checkUser.rows.length > 0) {
            console.log('Логин уже занят');
            return res.status(400).json({ success: false, message: 'Логин уже занят!' });
        }

        console.log('Добавление нового пользователя...');
        await pool.query('INSERT INTO users (login, password) VALUES ($1, $2)', [login, password]);
        console.log('Пользователь успешно добавлен');
        res.status(200).json({ success: true, message: 'Регистрация успешна!' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err.stack);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API для логина
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE login = $1 AND password = $2', [login, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: 'Логин успешен!', userId: result.rows[0].id });
        } else {
            res.status(401).json({ success: false, message: 'Неверный логин или пароль!' });
        }
    } catch (err) {
        console.error('Ошибка при логине:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API для создания персонажа
app.post('/create-character', async (req, res) => {
    const { userId, name } = req.body;
    try {
        const result = await pool.query('INSERT INTO characters (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name]);
        res.status(200).json({ success: true, message: 'Персонаж создан!', character: result.rows[0] });
    } catch (err) {
        console.error('Ошибка при создании персонажа:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API для получения списка персонажей
app.get('/characters/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
        res.status(200).json({ success: true, characters: result.rows });
    } catch (err) {
        console.error('Ошибка при получении персонажей:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});