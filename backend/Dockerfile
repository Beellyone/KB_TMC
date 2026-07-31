FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY src/ src/
RUN uv sync --frozen

COPY alembic/ alembic/
COPY alembic.ini ./

EXPOSE 8001

CMD ["sh", "-c", "uv run alembic upgrade head && uv run python -m tmc_backend.seed && uv run uvicorn tmc_backend.main:app --host 0.0.0.0 --port 8001"]
