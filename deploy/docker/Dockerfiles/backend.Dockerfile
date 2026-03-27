# ============================================
# Tonghua Public Welfare — Backend Dockerfile
# Multi-stage build for FastAPI application
# ============================================

# ---- Stage 1: Build dependencies ----
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system dependencies for building Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        libssl-dev \
        default-libmysqlclient-dev \
        pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 2: Production image ----
FROM python:3.11-slim AS production

LABEL maintainer="Tonghua Public Welfare Team"
LABEL description="Backend API service for Tonghua Public Welfare platform"

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libffi8 \
        libssl3 \
        default-libmysqlclient-dev \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r tonghua && useradd -r -g tonghua -d /app -s /sbin/nologin tonghua

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/ ./backend/

# Set ownership
RUN chown -R tonghua:tonghua /app

# Switch to non-root user
USER tonghua

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application with uvicorn
CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--log-level", "info", \
     "--access-log", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
