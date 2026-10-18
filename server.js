const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Pool } = require('pg'); // Подключаем PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// ===== Подключение к базе данных =====
// Если переменной нет (например, ты запускаешь локально), используем localhost
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kazino';
const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Функция для инициализации таблиц при старте
async function initDB() {
    try {
        // Таблица пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                password_encrypted TEXT,
                balance INTEGER DEFAULT 0,
                created_at BIGINT
            )
        `);

        // Таблица истории операций
        await pool.query(`
            CREATE TABLE IF NOT EXISTS history (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                delta INTEGER,
                reason VARCHAR(100),
                balance INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ База данных инициализирована');
    } catch (err) {
        console.error('❌ Ошибка инициализации БД:', err);
    }
}
initDB();

// ===== Блокировка чувствительных файлов от публичного доступа =====
app.use((req, res, next) => {
    const forbidden = ['/users.json', '/history.txt', '/server.js', '/package.json', '/package-lock.json'];
    if (forbidden.includes(req.path)) return res.status(403).send('Forbidden');
    next();
});

app.use(express.static(__dirname));

// ===== Секретные ключи для дебага =====
const DEBUG_SECRET = '2e749b04e07a3ff88173fbda6d227f51c2db872d08dd744f6181ee08be03467a';
const DEBUG_VIEW_KEY = 'посмотри-и-запомни-этот-ключ-12345';

function encryptPassword(plain) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(DEBUG_SECRET).digest(), iv);
    let encrypted = cipher.update(plain, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encrypted) {
    try {
        const [ivHex, data] = encrypted.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(DEBUG_SECRET).digest(), iv);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return '— ошибка расшифровки —';
    }
}

function generateSessionId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// сессии в памяти: sessionId -> { userId, createdAt }
const sessions = new Map();

// ===== Регистрация =====
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
    if (username.length < 2 || username.length > 30) return res.status(400).json({ error: 'Имя должно быть от 2 до 30 символов' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Некорректный email' });

    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'Этот email или имя уже заняты' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const passwordEncrypted = encryptPassword(password);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

        await pool.query(
            'INSERT INTO users (id, username, email, password_hash, password_encrypted, balance, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, username, email, passwordHash, passwordEncrypted, 0, Date.now()]
        );

        const sessionId = generateSessionId();
        sessions.set(sessionId, { userId: id, createdAt: Date.now() });

        res.cookie('session', sessionId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ ok: true, user: { id, username, email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ===== Вход =====
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(400).json({ error: 'Неверный email или пароль' });

        const sessionId = generateSessionId();
        sessions.set(sessionId, { userId: user.id, createdAt: Date.now() });

        res.cookie('session', sessionId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ ok: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ===== Кто я =====
app.get('/api/me', async (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.json({ user: null });

    const session = sessions.get(sessionId);
    if (!session) return res.json({ user: null });

    try {
        const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [session.userId]);
        const user = result.rows[0];
        if (!user) return res.json({ user: null });

        res.json({ user });
    } catch (err) {
        res.json({ user: null });
    }
});

// ===== Выход =====
app.post('/api/logout', (req, res) => {
    const sessionId = req.cookies.session;
    if (sessionId) sessions.delete(sessionId);
    res.clearCookie('session');
    res.json({ ok: true });
});

// ===== ДЕБАГ: список пользователей =====
app.get('/api/debug/users', async (req, res) => {
    if (req.query.key !== DEBUG_VIEW_KEY) return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query('SELECT * FROM users');
        const users = result.rows.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            balance: u.balance,
            createdAt: u.created_at,
            password: u.password_encrypted ? decryptPassword(u.password_encrypted) : '— нет —'
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

// ===== Получить баланс =====
app.get('/api/balance', async (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.status(401).json({ error: 'not logged in' });

    const session = sessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'session expired' });

    try {
        const result = await pool.query('SELECT balance FROM users WHERE id = $1', [session.userId]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'user not found' });
        res.json({ balance: result.rows[0].balance });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

// ===== Изменить баланс =====
app.post('/api/balance', async (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.status(401).json({ error: 'not logged in' });

    const session = sessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'session expired' });

    const { delta, reason } = req.body;
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be number' });

    try {
        const result = await pool.query('SELECT username, balance FROM users WHERE id = $1', [session.userId]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'user not found' });

        const newBalance = Math.max(0, user.balance + delta);

        // Обновляем баланс
        await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, session.userId]);

        // Пишем историю
        await pool.query(
            'INSERT INTO history (username, delta, reason, balance) VALUES ($1, $2, $3, $4)',
            [user.username, delta, reason || '-', newBalance]
        );

        res.json({ ok: true, balance: newBalance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// ===== История операций =====
app.get('/api/history', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history ORDER BY created_at DESC LIMIT 50');
        res.json({ text: result.rows });
    } catch (err) {
        res.json({ text: [] });
    }
});

// ===== Очистка истории =====
app.post('/api/reset', async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE history');
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'reset failed' });
    }
});

// ===== Онлайн-счётчик =====
const onlineSessions = new Map();
const ONLINE_TIMEOUT = 15000;

app.post('/api/ping', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'no sessionId' });
    onlineSessions.set(sessionId, Date.now());
    res.json({ ok: true });
});

app.get('/api/online', (req, res) => {
    const now = Date.now();
    for (const [id, lastSeen] of onlineSessions) {
        if (now - lastSeen > ONLINE_TIMEOUT) onlineSessions.delete(id);
    }
    res.json({ count: onlineSessions.size });
});

// ===== Запуск =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});