# ============================================================================
# LWG 灵务阁 · 前端运行镜像（多阶段构建）
#
# 构建阶段用 Node 打包静态资源，运行阶段用 nginx 托管并反向代理 /api 到后端。
# 这样对外只需暴露一个端口，前端也不再把后端地址编译进产物——
# "后端在哪里"只存在于 nginx 配置里（见 nginx/default.conf.template）。
#
# 构建：
#   docker build -t lwg-frontend:local .
#   （CI 中由 GitHub Actions 构建并推送到镜像仓库，见 .github/workflows）
# ============================================================================

# ---------- 构建阶段 ----------
FROM node:24-alpine AS build

WORKDIR /build

# 先装依赖：package.json 未变时可复用缓存
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:alpine

# 站点配置以模板形式放入：官方镜像的 entrypoint 会做环境变量替换，
# 因此 ${LWG_BACKEND_HOST} 可在运行时通过 compose 覆盖，无需重新构建
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# 静态资源
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
