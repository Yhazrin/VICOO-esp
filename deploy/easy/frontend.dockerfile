# ============================================
# VICOO — Frontend Dockerfile (Easy Deploy)
# ============================================

# ---- Stage 1: Build React application ----
FROM node:18-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build without API URL restriction (nginx proxies locally)
# Set VITE_API_URL to empty so app uses relative /api/ paths
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY ../nginx.conf /etc/nginx/conf.d/vicoo.conf

# Copy built React app
COPY --from=builder /build/dist /usr/share/nginx/html

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
