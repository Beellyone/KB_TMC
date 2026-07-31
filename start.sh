#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

cmd="${1:-docker}"

case "$cmd" in
  docker)
    echo "🚀 Запуск TMC Control..."
    docker compose up --build -d
    echo ""
    echo "✅ Проект запущен:"
    echo "   Frontend:   http://localhost:3000"
    echo "   Backend:    http://localhost:8001"
    echo "   Swagger:    http://localhost:8001/docs"
    echo "   PostgreSQL: localhost:5434"
    echo ""
    echo "   Логин:      admin / admin"
    ;;
  local)
    echo "🔧 Локальная разработка..."
    docker compose up -d db
    if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
    cd backend && uv sync --extra dev && uv run alembic upgrade head && uv run python -m tmc_backend.seed
    echo ""
    echo "Запустите в отдельных терминалах:"
    echo "  cd backend && uv run serve"
    echo "  cd frontend && npm run dev"
    ;;
  stop)
    docker compose down
    echo "✅ Остановлено"
    ;;
  logs)
    docker compose logs -f
    ;;
  *)
    echo "Использование: ./start.sh [docker|local|stop|logs]"
    exit 1
    ;;
esac
