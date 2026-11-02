# CLAUDE.md

Минимальный HTTP-сервис на Node.js + TypeScript + Express.

## Стек
- Node.js, TypeScript (strict)
- Express — HTTP-сервер
- Встроенный `node:test` (запуск через tsx) + Supertest — тесты

## Структура
- `src/app.ts` — создание Express-приложения и роуты (без `listen`, чтобы тестировать)
- `src/index.ts` — точка входа, запускает сервер на `PORT` (по умолчанию 3000)
- `tests/app.test.ts` — тесты эндпоинтов через Supertest

## Эндпоинты
- `GET /sum?a=<число>&b=<число>` → `200 { "result": <a+b> }`; при отсутствии/нечисловых параметрах — `400 { "error": "..." }`
- `GET /hello?name=<имя>` → `200 { "message": "Hello, <имя>!" }` (без `name` — `Hello, World!`)

## Команды
- `npm install` — установка зависимостей
- `npm run dev` — запуск в dev-режиме (tsx watch)
- `npm run build` — компиляция в `dist/`
- `npm start` — запуск собранного сервера
- `npm test` — тесты

## Правила
- Держать проект минимальным: без лишних зависимостей и слоёв.
- Каждый новый эндпоинт — с тестом в `tests/`.
