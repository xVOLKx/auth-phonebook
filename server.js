const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Подключаем базу (better-sqlite3 — синхронная)
const db = new Database(path.join(__dirname, 'app.db'));

// Создаём таблицы
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        phone TEXT,
        email TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

const SECRET_KEY = 'supersecretkey';

// ---------- Регистрация ----------
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password required');
    const hashed = bcrypt.hashSync(password, 8);
    try {
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        stmt.run(username, hashed);
        res.send('User registered');
    } catch (err) {
        res.status(400).send('User already exists');
    }
});

// ---------- Логин (выдаём JWT) ----------
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    if (!user) return res.status(401).send('Invalid credentials');
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).send('Invalid credentials');
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// ---------- Middleware для проверки JWT ----------
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('No token provided');
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).send('Invalid token');
        req.user = decoded;
        next();
    });
}

// ---------- Контакты (только для авторизованных) ----------
app.get('/contacts', authenticateToken, (req, res) => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE user_id = ?');
    const rows = stmt.all(req.user.id);
    res.json(rows);
});

app.post('/contacts', authenticateToken, (req, res) => {
    const { name, phone, email } = req.body;
    const stmt = db.prepare('INSERT INTO contacts (user_id, name, phone, email) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.user.id, name, phone, email);
    res.json({ id: info.lastInsertRowid });
});

app.put('/contacts/:id', authenticateToken, (req, res) => {
    const { name, phone, email } = req.body;
    const stmt = db.prepare('UPDATE contacts SET name = ?, phone = ?, email = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(name, phone, email, req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).send('Contact not found');
    res.send('Contact updated');
});

app.delete('/contacts/:id', authenticateToken, (req, res) => {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?');
    const result = stmt.run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).send('Contact not found');
    res.send('Contact deleted');
});

// ---------- HTML страницы ----------
app.get('/register-page', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Регистрация</title>
        <style>
            body { font-family: Arial; max-width: 400px; margin: 50px auto; padding: 20px; }
            input, button { display: block; width: 100%; margin: 10px 0; padding: 10px; }button { background: #007bff; color: white; border: none; cursor: pointer; }
            .error { color: red; }
        </style>
    </head>
    <body>
        <h2>Регистрация</h2>
        <form id="registerForm">
            <input type="text" id="username" placeholder="Логин" required>
            <input type="password" id="password" placeholder="Пароль" required>
            <button type="submit">Зарегистрироваться</button>
            <div id="message"></div>
        </form>
        <p>Уже есть аккаунт? <a href="/login-page">Войти</a></p>
        <script>
            document.getElementById('registerForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ username, password })
                });
                const text = await res.text();
                document.getElementById('message').innerHTML = text;
            };
        </script>
    </body>
    </html>`);
});

app.get('/login-page', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Вход</title>
        <style>
            body { font-family: Arial; max-width: 400px; margin: 50px auto; padding: 20px; }
            input, button { display: block; width: 100%; margin: 10px 0; padding: 10px; }
            button { background: #28a745; color: white; border: none; cursor: pointer; }
            .error { color: red; }
        </style>
    </head>
    <body>
        <h2>Вход</h2>
        <form id="loginForm">
            <input type="text" id="username" placeholder="Логин" required>
            <input type="password" id="password" placeholder="Пароль" required>
            <button type="submit">Войти</button>
            <div id="message"></div>
        </form>
        <p>Нет аккаунта? <a href="/register-page">Зарегистрироваться</a></p>
        <script>
            document.getElementById('loginForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ username, password })
                });
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/contacts-page';
                } else {
                    document.getElementById('message').innerHTML = 'Ошибка входа';
                }
            };
        </script>
    </body>
    </html>`);
});

app.get('/contacts-page', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Контакты</title>
        <style>
            body { font-family: Arial; max-width: 800px; margin: 20px auto; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .add-form { margin-bottom: 20px; }
            input, button { padding: 8px; margin: 5px; }
            .error { color: red; }
        </style>
    </head>
    <body>
        <h2>Мои контакты</h2>
        <div class="add-form">
            <input type="text" id="name" placeholder="Имя">
            <input type="text" id="phone" placeholder="Телефон">
            <input type="text" id="email" placeholder="Email">
            <button onclick="addContact()">Добавить</button>
        </div><table id="contactsTable">
            <thead><tr><th>ID</th><th>Имя</th><th>Телефон</th><th>Email</th><th>Действия</th></tr></thead>
            <tbody></tbody>
        </table>
        <p><a href="/login-page">Выйти</a></p>
        <script>
            const token = localStorage.getItem('token');
            if (!token) window.location.href = '/login-page';

            async function loadContacts() {
                const res = await fetch('/contacts', { headers: { 'Authorization': 'Bearer ' + token } });
                const contacts = await res.json();
                const tbody = document.querySelector('#contactsTable tbody');
                tbody.innerHTML = '';
                contacts.forEach(c => {
                    const row = tbody.insertRow();
                    row.insertCell(0).innerText = c.id;
                    row.insertCell(1).innerText = c.name;
                    row.insertCell(2).innerText = c.phone;
                    row.insertCell(3).innerText = c.email;
                    const actions = row.insertCell(4);
                    actions.innerHTML = '<button onclick="deleteContact(' + c.id + ')">Удалить</button>';
                });
            }

            async function addContact() {
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                const email = document.getElementById('email').value;
                await fetch('/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + token },
                    body: new URLSearchParams({ name, phone, email })
                });
                loadContacts();
            }

            async function deleteContact(id) {
                await fetch('/contacts/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
                loadContacts();
            }

            loadContacts();
        </script>
    </body>
    </html>`);
});

// Редирект с корня на страницу логина
app.get('/', (req, res) => {
    res.redirect('/login-page');
});

// Запуск сервера (порт для Render)
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Auth + Contacts app running on port ${port}`));