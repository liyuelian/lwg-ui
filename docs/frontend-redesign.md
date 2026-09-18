# 前端视觉与交互改版规格（lwg-ui）

> 状态：待实施。目标仓库：`/Users/liyuelian/Codes/IdeaCode/lwg-ui`（**不在 LWG 仓库内**，与本文档所在仓库分离）。
> 已确认方向：**宣纸水墨打底 + 天道碑（排行榜）局部暗色**。
> 关联文档：`docs/requirement-ranking.md`、`docs/requirement-frozen-detail.md`（这两份定义了榜单与冻结明细的接口契约）。
> 本文档可直接作为在 `lwg-ui` 目录新开会话的输入。

## 0. 新会话启动提示（可直接复制）

```text
请先读 /Users/liyuelian/Codes/IdeaCode/LWG/docs/frontend-redesign.md，
按其中的设计 token、逐文件清单和验收清单，对 lwg-ui 做视觉与交互改版。
同时参考 /Users/liyuelian/Codes/IdeaCode/LWG/docs/requirement-ranking.md
与 docs/requirement-frozen-detail.md 中已定义的接口契约。
```

## 1. 现状基线（已实测确认）

| 项 | 现状 |
| --- | --- |
| 技术栈 | Vue 3.5 + Element Plus 2.13 + ECharts 6 + vue-router 5 + axios，Vite 7，无 TS、无 Pinia、无 sass |
| 页面 | 3 个路由（`/login`、`/mission-hall`、`/dashboard`），2 个实体视图 |
| 体积 | `MissionHall.vue` 640 行、`UserDashboard.vue` 1005 行，其中约 60% 是 `<style scoped>` |
| 主题定制 | **零**。`main.js` 直接引 `element-plus/dist/index.css`，`style.css` 的 `:root` 只设了 `font-family`，全项目 `--el-color-primary` 无覆盖 |
| 主色 | `#8b3a3a`（朱砂）**硬编码 25 处**，散在 3 个视图文件 |
| 字体 | 3 个视图各自 `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC...')` |
| 响应式 | `grep -rn "@media" src/` → **0 处** |
| 登录 | `Login.vue` 把 UID 存进 `localStorage.lwg_user_id`，`router.beforeEach` 只判断该值是否存在，默认值为 `1`，页面文案写着"凡人测试模式：请输入 1 或 2" |
| `index.html` | `lang="en"`、`<title>lwg-ui</title>`、favicon 为 `/vite.svg` |

### 必须先修的三个基础问题（不是审美问题）

1. **线上标题字体实际未生效**。Google Fonts 在国内不可达，生产部署在阿里云、用户在国内，`font-family: 'Noto Serif SC', serif` 全部 fallback 成系统衬线；且 `@import` 阻塞渲染、同一份字体重复引入三次。
2. **Element Plus 与页面主色打架**。弹窗（`ElMessageBox`）、分页（`el-pagination`）、步骤条（`el-steps`）都是 Element 默认蓝 `#409eff`，与页面暗朱红同屏出现。
3. **`index.html` 三件小事**：`lang` 应为 `zh-CN`、标题应为「灵务阁」、favicon 应替换。

## 2. 设计 token

统一在 `src/style.css` 的 `:root` 中定义，视图内**只允许引用变量，不允许再写具体色值**。

### 2.1 色彩（宣纸水墨，全站默认）

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--lwg-paper` | `#f5f0e6` | 页面底色（替换现有 `#f0f2f5` 冷灰） |
| `--lwg-paper-2` | `#ede5d8` | 次级区块底 / 表头 |
| `--lwg-paper-3` | `#fbf8f1` | 卡片底（比页面略亮，靠明度而非阴影分层） |
| `--lwg-ink` | `#2b2b2b` | 正文墨色 |
| `--lwg-ink-2` | `#4a4a4a` | 次级文字 |
| `--lwg-ink-3` | `#8a8175` | 弱化文字 / 注释 / 占位符 |
| `--lwg-cinnabar` | `#8b3a3a` | 主色（**沿用现有值，保持连续性**） |
| `--lwg-cinnabar-hover` | `#a64d40` | 悬停（现有值） |
| `--lwg-cinnabar-active` | `#6e2c2c` | 按下 / 深色强调 |
| `--lwg-cinnabar-wash` | `#f3ecea` | 主色极浅底（选中行、标签底） |
| `--lwg-gold` | `#b08d57` | 金线 / 次级强调（榜徽、分割装饰） |
| `--lwg-line` | `#d9cfc0` | 墨线边框（**用 1px 边框取代卡片阴影**） |
| `--lwg-line-strong` | `#b8ab97` | 强分割线 |
| `--lwg-danger` | `#a33a3a` | 危险操作（撤榜等） |
| `--lwg-success` | `#4a7c59` | 成功态 |

### 2.2 暗色（仅天道碑 / 排行榜页）

实现方式：在榜单页根容器上加 `class="lwg-night"`，由该类**局部覆盖**同名变量，其余页面完全不受影响。**不要**引 `element-plus/theme-chalk/dark/css-vars.css` 全站切换。

| 变量（在 `.lwg-night` 作用域内覆盖） | 值 | 用途 |
| --- | --- | --- |
| `--lwg-paper` | `#12161c` | 碑面底色 |
| `--lwg-paper-2` | `#1b2029` | 次级区块 |
| `--lwg-paper-3` | `#1b2029` | 卡片底 |
| `--lwg-ink` | `#e8e3d9` | 正文（暖白，不用纯白） |
| `--lwg-ink-2` | `#9aa0a8` | 次级文字 |
| `--lwg-ink-3` | `#6b7178` | 弱化文字 |
| `--lwg-line` | `#2a313c` | 暗色墨线 |
| `--lwg-gold` | `#d4af6a` | 暗底金，榜单主要强调色 |
| `--lwg-glow` | `rgba(212, 175, 106, 0.25)` | Top3 微光（`box-shadow` 唯一允许出现的场景） |

Top3 徽记色：第一 `#d4af6a`（金）、第二 `#b9c0c8`（银）、第三 `#c08a5a`（铜）。

### 2.3 字体

```css
--lwg-font-display: "Songti SC", "STSong", "SimSun", "Noto Serif SC", Georgia, serif;
--lwg-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                 "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
```

**优先用系统字体栈，不再引 Google Fonts。** 若确实要求全平台字形统一，改用 `@fontsource/noto-serif-sc`（woff2 按 unicode-range 切片、离线可用、`font-display: swap`），**只用于标题**，不要用于正文——中文正文字体包体积不可接受。

字号阶梯：`12 / 13 / 14 / 16 / 20 / 28 / 32`。
标题 `letter-spacing` 收敛到 `2–4px`：现有 `MissionHall.vue:516` 的 `paper-title` 用了 `10px`，短标题尚可，长标题会散。

### 2.4 形状与间距

- 圆角 `2px`（`--lwg-radius`）。宣纸/印章风格不宜大圆角，现有 4px / 8px 混用需统一。
- 边框 `1px solid var(--lwg-line)` **取代卡片阴影**；仅浮层（弹窗、吸底卡片）保留一档轻阴影 `0 1px 2px rgba(43,43,43,.06)`。
- 纸张撕边 / 分段用 `1px dashed var(--lwg-line)`。
- 间距阶梯：`4 / 8 / 12 / 16 / 24 / 32 / 48`。
- 断点：`1280 / 960 / 640`。任务大厅在 `< 960px` 由表格切为卡片流，`< 640px` 单列。

### 2.5 Element Plus 变量覆盖

在 `src/style.css` 中覆盖（无需引入 sass；`light-3/5/7/8/9` 为主色向白色混合的派生值）：

```css
:root {
  --el-color-primary: var(--lwg-cinnabar);
  --el-color-primary-light-3: #a86a63;
  --el-color-primary-light-5: #c39b95;
  --el-color-primary-light-7: #ddc7c3;
  --el-color-primary-light-8: #e8d9d6;
  --el-color-primary-light-9: var(--lwg-cinnabar-wash);
  --el-color-primary-dark-2: var(--lwg-cinnabar-active);
  --el-color-danger: var(--lwg-danger);
  --el-color-success: var(--lwg-success);
  --el-border-radius-base: 2px;
  --el-border-color: var(--lwg-line);
  --el-text-color-primary: var(--lwg-ink);
  --el-text-color-regular: var(--lwg-ink-2);
  --el-text-color-secondary: var(--lwg-ink-3);
  --el-font-family: var(--lwg-font-body);
  --el-fill-color-blank: var(--lwg-paper-3);
}
```

`.lwg-night` 作用域内需再覆盖一次 `--el-*`（弹窗若在该页打开，否则会白底跳出暗色主题）。

## 3. 结构改造

### 3.1 新增 `src/components/AppLayout.vue`

现状是 `MissionHall.vue` 与 `UserDashboard.vue` **各自手写 header、标题与一组按钮样式**，第 26 行的筛选文案已经在 MissionHall 内部自相矛盾。第三个页面（天道碑）会复制第三份。

`AppLayout.vue` 提供：

- 顶部栏：左「灵务阁」标题（衬线 + 字距），右侧导航（任务大厅 / 个人中心 / 天道碑 / 退出）。
- 当前路由高亮；退出清 `localStorage.lwg_user_id` 并回 `/login`。
- 底部墨线分隔（`1px solid var(--lwg-line)`），不用阴影。
- 插槽 `default` 承载页面内容。
- **窄屏（`< 960px`）**：导航折叠为图标 + 汉堡菜单。

### 3.2 路由与过渡

- `src/router/index.js` 新增 `/rank` → `RankBoard.vue`（懒加载，与其他路由一致）。
- `App.vue` 用 `<router-view v-slot="{ Component }">` + `<transition name="fade">`（120ms）消除首次进入大厅的白屏空档。
- 可选：懒加载期间给骨架屏。

### 3.3 API 层整理

- `src/api/user.js` 中的 `getMyMissions` 打的是 `/mission/my-missions`，**应挪到 `src/api/mission.js`**。
- 新增 `src/api/rank.js`（契约见 `docs/requirement-ranking.md` 第 4 节）：`getRankBoard(params)`、`getMyRank(params)`。
- 新增 `src/api/user.js`：`getFrozenList(userId)`、`getFrozenHistory(params)`、`getReconcile(userId)`（契约见 `docs/requirement-frozen-detail.md` 第 5 节）。

## 4. 交互改造

| 现状 | 目标 |
| --- | --- |
| 所有非 200 一律 `ElMessage.error` 弹 toast（`request.js`） | 抢单/提交/审核等**可预期失败就地反馈**：卡片底部红字提示 2s 淡出，不弹窗；toast 只保留给系统级异常 |
| 抢单按钮无 loading | 按钮 `loading` + 成功后**卡片原位变更状态**，不整页刷新 |
| 无路由过渡 | 120ms 淡入，配骨架屏 |
| `request.js` `timeout: 5000` | 事务类接口（发布/审核/充值）放宽到 15000；`/admin/reconcile` 这类诊断接口的错误需**就地渲染对账结果**，不吞成 toast |
| 任务大厅一次性拉全部（后端 `selectList` 也无分页） | 前端先做卡片网格 + 虚拟滚动或分页；后端分页见 `docs/project-overview.md` 第 11 节 |
| 无响应式 | 按 2.4 的断点改造，重点是大厅表格与个人中心双列图表 |

## 5. 逐文件改动清单

| 文件 | 改动 |
| --- | --- |
| `index.html` | `lang="zh-CN"`；`<title>灵务阁</title>`；替换 favicon（可放一个印章风格的 svg 到 `public/`） |
| `src/style.css` | 写入全部设计 token、Element Plus 变量覆盖、`.lwg-night` 作用域、正文/标题字体栈、全局滚动条与选中色 |
| `src/App.vue` | 保留 `router-view`，加路由过渡；`body` 背景改用 `var(--lwg-paper)` |
| `src/components/AppLayout.vue` | **新增**，见 3.1 |
| `src/views/Login.vue` | 移除 `@import` Google Fonts；改用 token；改写"凡人测试模式：请输入 1 或 2"的测试文案（后端尚无登录接口，暂保留 UID 登录形式但不得像测试页） |
| `src/views/MissionHall.vue` | 套 `AppLayout`；移除 `@import`；`getStatusText`（第 325 行）文案与后端 `MissionStatusEnum` 对齐（`1 → 进行中`、`2 → 待验收`，注意同文件第 26 行已用「进行中」，前端自身也不一致）；卡片网格 + 响应式；抢单/撤榜改内联反馈 |
| `src/views/UserDashboard.vue` | 套 `AppLayout`；移除 `@import`；**第 519 行的 `window.addEventListener('resize', ...)` 需在 `onUnmounted` 中解绑**（当前路由切走后监听仍在，闭包持有旧 chart 实例）；ECharts 配色改用 token；抽出 `FrozenFundCard.vue` |
| `src/components/FrozenFundCard.vue` | **新增**（依赖后端 `/user/frozen/list`，可先按契约 mock） |
| `src/views/RankBoard.vue` | **新增**，见第 6 节 |
| `src/api/rank.js` | **新增** |
| `src/api/user.js` / `src/api/mission.js` | 迁移 `getMyMissions`；新增冻结与对账方法 |
| `src/router/index.js` | 新增 `/rank` 路由 |

## 6. 天道碑页面（`RankBoard.vue`）视觉规格

- 整页 `.lwg-night` 暗色，是**唯一**使用暗色的页面；离开该路由必须移除 class，不得污染其他页面。
- 顶部：Tab 切换「信誉榜 / 接单王榜」（Element `el-tabs` 需在 `.lwg-night` 内覆盖变量）。
- 榜单行为弹幕式列表：名次徽记（Top3 金银铜 + `--lwg-glow` 微光）、道号、境界（`realmDesc`）、分值、复线信息（`extra`）。
- **当前用户所在行高亮**（`--lwg-cinnabar-wash` 在暗色下的对应值），即使未进前 20 也要在底部吸底卡片显示：
  `我的名次 #7 · 6100 · 再提升 50 点信誉即可超越 路人甲`（字段为 `rank` / `score` / `gapHint`）。
- `ranked: false` 时显示引导文案（如"完成第一单即可上榜"），**不要显示空态或报错**。
- 数据契约见 `docs/requirement-ranking.md` 第 4 节；**月榜依赖后端 `finish_time` 落库，届时后端会以 400 拒绝 `period=month`**，前端需把月榜 Tab 置灰并给 tooltip 说明，不要让它报错。

## 7. 范围之外（本次不做，避免与后端需求抢时间）

- 不引入 TypeScript、Pinia、Tailwind、sass。
- 不把假登录换成真登录（依赖后端先产出 `UserController.login` + JWT；`request.js` 的请求拦截器目前是空的，那正是将来挂 token 的位置，结构已预留）。
- 不重写业务逻辑，只动样式、结构与反馈方式。

## 8. 验收清单

- **AC1** `grep -rn "fonts.googleapis" src/` 无结果（外链字体已清除）。
- **AC2** `grep -rn "#8b3a3a" src/views src/components` 无结果（色值只存在于 `style.css` 的 token 定义）。
- **AC3** 弹出 `ElMessageBox`、`el-pagination`、`el-steps` 的主色为朱砂而非 Element 默认蓝（截图或 DOM 计算样式断言）。
- **AC4** 浏览器标签标题为「灵务阁」。
- **AC5** 375px / 768px / 1440px 三个宽度下均无横向滚动条，任务列表可正常阅读。
- **AC6** 路由切换无白屏空档，且**无 JS 报错**（沿用 `docs/change-log.md` 中"CDP 驱动真实界面验证"的做法，不要只做静态检查）。
- **AC7** 进入 `/rank` 为暗色、返回 `/mission-hall` 恢复宣纸色（class 未泄漏）。
- **AC8** 抢单失败时**不弹 toast**，错误原因在卡片内就地展示。
- **AC9** 从 `/dashboard` 切走后 resize 窗口不再触发旧图表实例（解绑生效）。
- **AC10** 走完整业务闭环（充值 → 发布 → 抢单 → 提交 → 审核通过）界面无异常，与后端接口联调通过。

## 9. 待确认问题

1. 是否需要暗色的「个人中心」（目前规划只有天道碑用暗色）？
2. 是否接受用系统字体栈替代 Google Fonts？若要求全平台字形统一，需引入 `@fontsource/noto-serif-sc` 并接受包体积。
3. `Login.vue` 的测试文案是否现在就改写（后端登录接口尚未立项）？
4. favicon 是否要专门设计一个印章图标，还是先用文字「灵」生成？
5. 任务大厅是否本期就改卡片网格 + 分页，等后端 `selectList` 支持分页后再对齐？
