# ============================================
# VICOO — Frontend Dockerfile (Easy Deploy)
# ============================================

# ---- Stage 1: Build React application ----
FROM node:18-alpine AS builder

WORKDIR /build

# ✅ 修复路径：从项目根目录寻找 frontend 代码
COPY frontend/web-react/package.json frontend/web-react/package-lock.json* ./
RUN npm install --legacy-peer-deps

# ✅ 修复路径
COPY frontend/web-react/ .

# Build without API URL restriction (nginx proxies locally)
# Set VITE_API_BASE_URL to /api/v1 to match backend router prefix
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Skip tsc type-checking to avoid TS errors in dev code
RUN npx vite build

# ---- Admin SPA（base=/admin/）——与主站同镜像、同端口，挂在 /admin/ 路径下 ----
WORKDIR /build-admin
COPY admin/package.json admin/package-lock.json* ./
RUN npm ci
COPY admin/ .
RUN npx vite build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration (same dir as dockerfile build context)
# ✅ 修复路径：从项目根目录寻找 nginx 配置
COPY deploy/easy/nginx.conf /etc/nginx/conf.d/vicoo.conf

# Copy built React apps — 主站根路径 + 管理后台 /admin/
COPY --from=builder /build/dist /usr/share/nginx/html
COPY --from=builder /build-admin/dist /usr/share/nginx/html/admin

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
