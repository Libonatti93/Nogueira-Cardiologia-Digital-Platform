FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-impress poppler-utils python3 fonts-dejavu-core fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
COPY render.py /render.py
USER 65534:65534
ENTRYPOINT ["python3", "/render.py"]
