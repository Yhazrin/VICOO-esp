# ============================================
# Tonghua Public Welfare — Frontend Dockerfile
# Multi-stage build for React SPA
# ============================================

# ---- Stage 1: Build React application ----
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files for dependency caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

LABEL maintainer="Tonghua Public Welfare Team"
LABEL description="Frontend SPA for Tonghua Public Welfare platform"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy custom nginx configuration template
COPY ../../deploy/docker/nginx/nginx.conf /etc/nginx/conf.d/tonghua.conf.template

# Copy built React app from builder stage
COPY --from=builder /build/dist /usr/share/nginx/html

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost:80 || exit 1

# Start nginx with environment variable substitution
# API_URL defaults to empty (only same-origin requests allowed) if not set
CMD ["sh", "-c", "envsubst '${API_URL}' < /etc/nginx/conf.d/tonghua.conf.template > /etc/nginx/conf.d/tonghua.conf && nginx -g 'daemon off;'"]
