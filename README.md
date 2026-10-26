# ProjectSprint Mobile

Мобильный трекер командных проектов для студентов. Фронтенд на React и Vite подключён к [бэкенду на Flask и PostgreSQL](https://github.com/ProjectSprint-Polytechnic/project-sprint-backend).

Работают вход, регистрация, сохранение сессии и выход. После входа приложение показывает профиль, проекты и задачи из API. Восстановление доступа принимает заявку; отправка писем на бэкенде пока не подключена.

## Совместный запуск через Docker

Клонируйте оба репозитория рядом:

```sh
git clone git@github.com:ProjectSprint-Polytechnic/ProjectNew.git
git clone git@github.com:ProjectSprint-Polytechnic/project-sprint-backend.git
cd ProjectNew
docker compose up --build
```

Откройте [localhost:5173](http://localhost:5173). В этом режиме nginx передаёт запросы `/api` бэкенду, а PostgreSQL хранит данные в Docker volume. Миграции применяются автоматически; при первом запуске бэкенд создаёт демонстрационные данные.

Тестовые пользователи: `ivan` (руководитель) и `alisa` (студент). Пароль: `politech123`.

Если бэкенд находится в другой папке, укажите `BACKEND_PATH` в `.env`. Порт интерфейса задаётся через `WEB_PORT`. Для отдельного окружения задайте свои `SECRET_KEY`, `JWT_SECRET_KEY` и `POSTGRES_PASSWORD`.

## Разработка

Запустите бэкенд из его репозитория:

```sh
docker compose up --build
```

Затем из папки фронтенда:

```sh
npm ci
cp .env.example .env
npm run dev
```

Vite передаёт запросы `/api` на `http://localhost:5001`. Адрес бэкенда можно изменить через `API_PROXY_TARGET`; префикс API в браузере задаётся через `VITE_API_BASE_URL` (по умолчанию `/api`). Прямой запуск Flask без Docker использует порт `5000`.

## Проверка

```sh
npm test
npm run lint
npm run build
```

Эти проверки также выполняются в GitHub Actions. Команды для тестирования API описаны в README бэкенда.
