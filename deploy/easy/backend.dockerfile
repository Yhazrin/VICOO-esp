# ============================================
# VICOO — Backend Dockerfile (Easy Deploy)
# ============================================

FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies (including mysql client for entrypoint)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        libffi8 \
        libssl3 \
        default-libmysqlclient-dev \
        pkg-config \
        default-mysql-client && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker cache
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy .env (for pydantic_settings to read), entrypoint, and create data dir
COPY deploy/easy/.env /app/.env
COPY deploy/easy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data

EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
