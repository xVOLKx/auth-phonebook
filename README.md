# Телефонная книга с авторизацией (JWT + Express + PostgreSQL)

Веб-приложение, где пользователи могут регистрироваться, входить в систему и управлять своими контактами (CRUD). База данных — PostgreSQL.

## Живая версия

👉 [https://auth-phonebook.onrender.com](https://auth-phonebook.onrender.com)

(Ничего устанавливать не нужно — просто открой ссылку)

## Как 🚀 запустить локально (для разработки)

1. Установи [Node.js](https://nodejs.org/)
2. Установи [PostgreSQL](https://www.postgresql.org/download/windows/)
3. Создай базу данных auth_phonebook_db (через pgAdmin или командой `createdb auth_phonebook_db`)
4. Склонируй репозиторий:
   ```bash
   git clone https://github.com/xVOLKx/auth-phonebook.git
   ```
5. Перейди в папку проекта:
   ```bash
   cd auth-phonebook
   ```
6. Установи зависимости:
   ```bash
    npm install
   ```
7. Укажи пароль от PostgreSQL в файле server.js (строка password: '1234')
8. Запусти сервер:
   ```bash
   node server.js
   ```
9. Открой в браузере: http://localhost:3000

Функции

. Регистрация и вход (JWT)
· Просмотр, добавление, удаление контактов
· Каждый пользователь видит только свои контакты

🛠️ Технологии

· Node.js, Express
· PostgreSQL
· JWT, bcrypt
· HTML, CSS