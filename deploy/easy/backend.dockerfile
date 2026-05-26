# ============================================
# VICOO — Backend Dockerfile (Easy Deploy)
# ============================================

FROM python:3.11-slim

WORKDIR /app

# Faster apt on CN / congested links to deb.debian.org
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true; \
    sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null || true

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
RUN pip install --no-cache-dir -r requirements.txt email-validator

# Copy backend application code
COPY backend/ ./backend/

# .env is injected at runtime via docker-compose env_file — never COPY into the image
# (secrets in a Docker layer are extractable via docker history / image pull)
COPY deploy/easy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data

EXPOSE 8000

ENV PYTHONPATH=/app/backend:$PYTHONPATH

# Default command (used by containers if entrypoint doesn't override)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
