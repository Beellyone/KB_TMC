# TMC Control

Система контроля ремонта ТМЦ через внешних подрядчиков.

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/Beellyone/KB_TMC.git
cd KB_TMC

# Запустить всё одной командой
./start.sh
```

После запуска:

| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8001 |
| **Swagger UI** | http://localhost:8001/docs |
| **PostgreSQL** | localhost:5434 |

**Логин по умолчанию:** `admin` / `admin`

## Команды start.sh

| Команда | Описание |
|---------|----------|
| `./start.sh` | Запуск всего через Docker (DB + Backend + Frontend) |
| `./start.sh local` | Только PostgreSQL в Docker, backend/frontend локально |
| `./start.sh stop` | Остановить все контейнеры |
| `./start.sh logs` | Показать логи |

## Локальная разработка (без Docker)

```bash
# 1. Запустить PostgreSQL
./start.sh local

# 2. В отдельных терминалах:
cd backend && uv run serve          # Backend на :8001
cd frontend && npm run dev          # Frontend на :3000
```

## Стек

### Backend
- **FastAPI** — веб-фреймворк
- **SQLAlchemy 2.0** (async) — ORM
- **Alembic** — миграции БД
- **Pydantic v2** — валидация
- **structlog** — структурированные логи
- **JWT** — аутентификация (access + refresh токены)
- **uv** — менеджер пакетов
- **ruff** — линтер
- **pytest** — тестирование

### Frontend
- **React 19** + **TypeScript**
- **Vite** — сборщик
- **react-router-dom** — роутинг

### Инфраструктура
- **PostgreSQL 16** — база данных
- **Docker** + **docker-compose**

## Структура проекта

```
KB_TMC/
├── start.sh                 # Скрипт запуска
├── docker-compose.yml       # app + frontend + db
├── backend/                 # FastAPI backend
│   ├── Dockerfile
│   ├── alembic/             # Миграции БД
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── src/tmc_backend/
│       ├── main.py          # FastAPI приложение
│       ├── config.py        # Настройки из .env
│       ├── database.py      # Async SQLAlchemy
│       ├── logging.py       # structlog
│       ├── seed.py          # Создание admin пользователя
│       ├── models/          # SQLAlchemy модели
│       ├── auth/            # JWT аутентификация
│       ├── schemas/         # Pydantic схемы
│       └── api/v1/          # API эндпоинты
└── frontend/                # React frontend
    ├── Dockerfile
    ├── vite.config.ts       # Vite + proxy на backend
    └── src/
        ├── theme.ts         # Цветовая тема
        ├── context/         # AuthContext + ThemeContext
        ├── components/      # Layout (header, меню, профиль)
        ├── api/             # HTTP-клиент
        └── pages/           # Страницы (Login, Profile, etc.)
```

## Переменные окружения

Шаблон: `backend/.env.example`

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `APP_PORT` | Порт backend | `8001` |
| `DATABASE_URL` | Подключение к БД | `postgresql+asyncpg://tmc:tmc_secret@localhost:5434/tmc_db` |
| `JWT_SECRET_KEY` | Секрет JWT | `change-me-to-a-random-secret` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни access-токена | `30` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Время жизни refresh-токена | `7` |
| `CORS_ORIGINS` | Разрешённые origin | `["http://localhost:3000"]` |

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/login` | Логин (username + password → JWT) |
| POST | `/api/v1/auth/logout` | Выход |
| POST | `/api/v1/auth/refresh` | Обновление access-токена |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| POST | `/api/v1/auth/change-password` | Смена пароля |
| GET | `/health` | Health check |

Полная документация: http://localhost:8001/docs
