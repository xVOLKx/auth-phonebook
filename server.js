const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'users.db'));
db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);

const SECRET_KEY = 'supersecretkey';

// Регистрация
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password required');
    const hashed = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashed], (err) => {
        if (err) return res.status(400).send('User already exists');
        res.send('User registered');
    });
});

// Логин
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(401).send('Invalid credentials');
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).send('Invalid credentials');
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Защищённый маршрут
app.get('/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('No token provided');
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).send('Invalid token');
        res.send(`Hello, ${decoded.username}. This is your profile.`);
    });
});

app.listen(3000, () => console.log('JWT Auth running on http://localhost:3000'));