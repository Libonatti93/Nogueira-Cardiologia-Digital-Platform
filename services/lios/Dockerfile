FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN useradd --uid 10001 --create-home lios
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install '.[dev]'
COPY tests ./tests
USER lios
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV RELEASE_SHA=$GIT_SHA
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz',timeout=3)"
CMD ["uvicorn", "lios.main:app", "--host", "0.0.0.0", "--port", "8080", "--no-proxy-headers", "--no-access-log"]
