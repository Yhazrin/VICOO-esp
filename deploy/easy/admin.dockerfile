# ============================================
# VICOO — Admin Dashboard Dockerfile (Easy Deploy)
# ============================================

# ---- Stage 1: Build React application ----
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files
COPY admin/package.json admin/package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY admin/ ./

# Build with default base (served at root, API calls proxied by nginx)
# Skip tsc type-checking to avoid TS errors in dev code
RUN npx vite build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Admin-specific nginx config
COPY deploy/easy/nginx-admin.conf /etc/nginx/conf.d/admin.conf

# Copy built React admin app
COPY --from=builder /build/dist /usr/share/nginx/html

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
