FROM ghcr.io/astral-sh/uv:0.10.4 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /usr/local/bin/uv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy
WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY src ./src
COPY backend ./backend
RUN uv sync --frozen --no-dev --no-editable && useradd --uid 10001 --create-home app
USER 10001
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
