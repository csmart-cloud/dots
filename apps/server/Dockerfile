FROM node:18-alpine AS base

# Base image setup
RUN apk update && apk add --no-cache libc6-compat

# Builder stage: chuẩn bị các file cần thiết
FROM base AS builder
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune web --docker

# Installer stage: cài đặt dependencies
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
RUN yarn install
COPY --from=builder /app/out/full/ .

# Build Vite project
WORKDIR /app/apps/web
RUN yarn build

# Runner stage: dùng Nginx để serve build của Vite
FROM nginx:alpine AS runner
WORKDIR /app

# Tạo user không phải root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 vitejs

# Copy bản build vào thư mục static của nginx
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html

# Gỡ config mặc định và thêm config tùy chỉnh cho SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

USER vitejs
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
