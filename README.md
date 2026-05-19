# JWT авторизация на Node.js

Простой сервер с регистрацией, логином и защищённым маршрутом (JWT, bcrypt, SQLite).

## Как 🚀 запустить

1. Установи [Node.js](https://nodejs.org/)
2. Склонируй репозиторий:
   ```bash
   git clone https://github.com/xVOLKx/jwt-auth.git
   ```
3. Перейди в папку проекта:
   ```bash
   cd jwt-auth
   ```
4. Установи зависимости:
   ```bash
   npm install
   ```
5. Запусти:
   ```bash
   node server.js
   ```
6. Используй curl или Postman для теста:
   ```bash
   · Регистрация: POST /register (username, password)
   · Логин: POST /login (получить токен)
   · Профиль: GET /profile (защищён маршрут)
   ```  
## Результат

 В консоль выводятся первые 5 курсов
 Все 54 курса сохраняются в файл cbr_rates.json

## 🛠️ Технологии

- Node.js
- Express
- JWT (jsonwebtoken)
- bcryptjs
- SQLite