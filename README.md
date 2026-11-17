# ProjectSprint Mobile

Веб-приложение для студенческих команд. В нём ведут канбан-доску, следят за дедлайнами, обновляют проекты, загружают отчёты и переписываются в чатах. В профиле виден прогресс по компетенциям. Руководители могут создавать разделы доски и проекты, просматривать навыки команды и отправлять рекомендации.

Интерфейс использует React и Vite. Данные сохраняются в PostgreSQL через [бэкенд на Flask](https://github.com/ProjectSprint-Polytechnic/project-sprint-backend).

## Запуск через Docker Compose

Установите Docker с Compose и клонируйте оба репозитория в одну папку.

```sh
git clone https://github.com/ProjectSprint-Polytechnic/ProjectNew.git
git clone https://github.com/ProjectSprint-Polytechnic/project-sprint-backend.git
cd ProjectNew
docker compose up --build -d --wait
```

Откройте [localhost:5173](http://localhost:5173). При первом запуске бэкенд применит миграции и добавит демонстрационные данные. Для проверки войдите как `ivan` (руководитель) или `alisa` (студент). Пароль для обоих аккаунтов — `politech123`.

Чтобы выбрать другой порт, задайте `WEB_PORT`. Если бэкенд находится в другой папке, задайте `BACKEND_PATH`. Для окружения с реальными данными задайте свои `SECRET_KEY`, `JWT_SECRET_KEY` и `POSTGRES_PASSWORD`.

Команда `docker compose down` останавливает приложение. Данные останутся в томах Docker.

## Разработка

Установите Node.js 22. В каталоге `project-sprint-backend` запустите `docker compose up --build -d`. Затем в каталоге `ProjectNew` выполните:

```sh
npm ci
npm run dev
```

Vite перенаправляет запросы `/api` на `http://localhost:5001`. Если API слушает другой адрес, укажите его в `API_PROXY_TARGET`. Пример настроек есть в `.env.example`.

## Проверки

```sh
npm test
npm run lint
npm run build
```

Для проверки API см. [инструкцию в репозитории бэкенда](https://github.com/ProjectSprint-Polytechnic/project-sprint-backend#readme).
