const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// ===== Блокировка чувствительных файлов от публичного доступа =====
// Эта проверка идёт ДО express.static, чтобы файлы нельзя было скачать по прямой ссылке
app.use((req, res, next) => {
    const forbidden = [
        '/users.json',
        '/history.txt',
        '/server.js',
        '/package.json',
        '/package-lock.json'
    ];

    if (forbidden.includes(req.path)) {
        return res.status(403).send('Forbidden');
    }

    next();
});

app.use(express.static(__dirname));

const HISTORY_FILE = path.join(__dirname, 'history.txt');
const USERS_FILE = path.join(__dirname, 'users.json');

// создаём файлы, если их нет
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

// ===== Секретные ключи для дебага =====
// ЗАМЕНИ на свои длинные случайные строки!
// Никогда не коммить эти значения в публичный репозиторий.
const DEBUG_SECRET = '2e749b04e07a3ff88173fbda6d227f51c2db872d08dd744f6181ee08be03467a';
const DEBUG_VIEW_KEY = 'посмотри-и-запомни-этот-ключ-12345';

// Обратимое шифрование пароля — только для дебага
function encryptPassword(plain) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        crypto.createHash('sha256').update(DEBUG_SECRET).digest(),
        iv
    );
    let encrypted = cipher.update(plain, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encrypted) {
    try {
        const [ivHex, data] = encrypted.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            crypto.createHash('sha256').update(DEBUG_SECRET).digest(),
            iv
        );
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return '— ошибка расшифровки —';
    }
}

// ===== Вспомогательные функции =====
function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function generateSessionId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// сессии в памяти: sessionId -> { userId, createdAt }
const sessions = new Map();

// ===== Регистрация =====
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (username.length < 2 || username.length > 30) {
        return res.status(400).json({ error: 'Имя должно быть от 2 до 30 символов' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
    }

    const users = readUsers();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'Это имя уже занято' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const passwordEncrypted = encryptPassword(password);

    const user = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        username,
        email,
        passwordHash,
        passwordEncrypted,      // обратимо зашифрованный пароль (для дебага)
        balance: 0,
        createdAt: Date.now()
    };

    users.push(user);
    writeUsers(users);

    const sessionId = generateSessionId();
    sessions.set(sessionId, { userId: user.id, createdAt: Date.now() });

    res.cookie('session', sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        ok: true,
        user: { id: user.id, username: user.username, email: user.email }
    });
});

// ===== Вход =====
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
        return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const sessionId = generateSessionId();
    sessions.set(sessionId, { userId: user.id, createdAt: Date.now() });

    res.cookie('session', sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        ok: true,
        user: { id: user.id, username: user.username, email: user.email }
    });
});

// ===== Кто я =====
app.get('/api/me', (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.json({ user: null });

    const session = sessions.get(sessionId);
    if (!session) return res.json({ user: null });

    const users = readUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return res.json({ user: null });

    res.json({
        user: { id: user.id, username: user.username, email: user.email }
    });
});

// ===== Выход =====
app.post('/api/logout', (req, res) => {
    const sessionId = req.cookies.session;
    if (sessionId) sessions.delete(sessionId);

    res.clearCookie('session');
    res.json({ ok: true });
});

// ===== ДЕБАГ: список пользователей с расшифрованными паролями =====
// Открывай ТОЛЬКО сам, в браузере или через curl:
//   http://localhost:3000/api/debug/users?key=посмотри-и-запомни-этот-ключ-12345
app.get('/api/debug/users', (req, res) => {
    if (req.query.key !== DEBUG_VIEW_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const users = readUsers();

    const result = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        balance: u.balance || 0,
        createdAt: u.createdAt,
        password: u.passwordEncrypted ? decryptPassword(u.passwordEncrypted) : '— нет —'
    }));

    res.json(result);
});

// ===== Получить баланс текущего игрока =====
app.get('/api/balance', (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.status(401).json({ error: 'not logged in' });

    const session = sessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'session expired' });

    const users = readUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: 'user not found' });

    res.json({ balance: user.balance || 0 });
});

// ===== Изменить баланс =====
app.post('/api/balance', (req, res) => {
    const sessionId = req.cookies.session;
    if (!sessionId) return res.status(401).json({ error: 'not logged in' });

    const session = sessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'session expired' });

    const { delta, reason } = req.body;
    if (typeof delta !== 'number') {
        return res.status(400).json({ error: 'delta must be number' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: 'user not found' });

    user.balance = Math.max(0, (user.balance || 0) + delta);
    writeUsers(users);

    const date = new Date().toLocaleString('ru-RU');
    const sign = delta > 0 ? '+' : '';
    const line = `[${date}] ${user.username} | ${sign}${delta} ₽ | ${reason || '-'} | баланс: ${user.balance}\n`;

    fs.appendFile(HISTORY_FILE, line, (err) => {
        if (err) console.error('Ошибка записи истории:', err);
    });

    res.json({ ok: true, balance: user.balance });
});

// ===== История операций (только чтение) =====
app.get('/api/history', (req, res) => {
    fs.readFile(HISTORY_FILE, 'utf8', (err, data) => {
        if (err) return res.json({ text: '' });
        res.json({ text: data });
    });
});

// ===== Очистка истории (кнопка разработчика) =====
app.post('/api/reset', (req, res) => {
    fs.writeFile(HISTORY_FILE, '', (err) => {
        if (err) return res.status(500).json({ error: 'reset failed' });
        res.json({ ok: true });
    });
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
    console.log('=================================');
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log('Для доступа с других устройств узнай IP:');
    console.log('  Windows: ipconfig');
    console.log('  macOS/Linux: ifconfig');
    console.log('=================================');
});