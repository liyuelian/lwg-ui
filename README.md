# lwg-ui

LWG「灵务阁」的前端界面 —— 一个模拟修仙宗门任务大厅的练手项目。

后端仓库：[liyuelian/LWG](https://github.com/liyuelian/LWG)

## 技术栈

| 组件 | 用途 |
| --- | --- |
| Vue 3 | 组合式 API + `<script setup>` |
| Vite | 开发服务器与构建 |
| Element Plus | 表格、弹窗、提示等基础组件 |
| ECharts | 财务对账页的折线图与饼图 |
| Vue Router | 路由与登录态守卫 |
| Axios | 统一请求封装与响应拦截 |

## 页面

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | 登录 | 输入用户 ID 即可，登录态存于 `localStorage` 的 `lwg_user_id` |
| `/mission-hall` | 任务大厅 | 按状态分页签浏览任务，可发布悬赏、抢单、提交凭证、撤榜 |
| `/dashboard` | 个人中心 | 余额与冻结押金、我发布的/我接取的任务、审核通过或驳回、财务对账图表、信誉流水 |

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
```

开发服务器会把 `/api` 代理到本机的后端 `http://localhost:8080`
（见 `vite.config.js`），因此本地需要先启动 LWG 后端。

## 构建与容器化

```bash
npm run build    # 产物输出到 dist/
docker build -t lwg-frontend:local .
```

镜像用 nginx 托管静态资源，并把 `/api` 反向代理到后端容器。
**后端地址不编译进产物**，而是由运行时的环境变量 `LWG_BACKEND_HOST` 提供
（见 `nginx/default.conf.template`），所以同一份镜像可以部署到任何环境。

## CI

推送到 `main` 或对 `main` 提 PR 会触发 `.github/workflows/frontend-ci.yml`：

1. `build` —— 安装依赖并执行 `vite build`，确认可构建（PR 的主要门禁）；
2. `image` —— 仅在 push 时构建 nginx 镜像并推送到 `ghcr.io/liyuelian/lwg-frontend`，
   打两个标签：commit sha（不可变，便于回滚）与 `latest`。

## 说明

项目中的用户身份通过请求参数传递（如 `userId`、`publisherId`、`acceptorId`），
尚未接入登录态与权限校验，属于练手阶段的简化设计。
