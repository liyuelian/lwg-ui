<template>
  <div class="shell">
    <!-- 顶部栏：左标题 + 右导航。墨线分隔，不用阴影 -->
    <header class="bar">
      <div class="bar__inner">
        <router-link to="/mission-hall" class="brand" @click="closeMenu">
          <span class="brand__seal" aria-hidden="true">灵</span>
          <span class="brand__text">
            <span class="brand__name">灵务阁</span>
            <span class="brand__sub">{{ subtitle }}</span>
          </span>
        </router-link>

        <!-- 宽屏：横向导航 -->
        <nav class="nav" aria-label="主导航">
          <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav__item"
              :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon class="nav__icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
          <button class="nav__item nav__item--quit" type="button" @click="handleLogout">
            <el-icon class="nav__icon"><SwitchButton /></el-icon>
            <span>退出</span>
          </button>
        </nav>

        <!-- 窄屏：汉堡 -->
        <button
            class="burger"
            type="button"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            aria-label="展开导航"
            @click="menuOpen = !menuOpen"
        >
          <el-icon><Expand v-if="!menuOpen" /><Fold v-else /></el-icon>
        </button>
      </div>

      <!-- 窄屏折叠面板。
           外层 .drawer 只负责媒体查询显隐，内层 v-show 负责展开/收起，
           避免 v-show 的内联 display 与媒体查询的 display 互相压制。 -->
      <div class="drawer">
        <transition name="drawer">
          <nav v-show="menuOpen" class="drawer__panel" aria-label="主导航（窄屏）">
            <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="drawer__item"
                :class="{ 'is-active': isActive(item.path) }"
                @click="closeMenu"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </router-link>
            <button class="drawer__item drawer__item--quit" type="button" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出</span>
            </button>
          </nav>
        </transition>
      </div>
    </header>

    <!-- 页面内容。
         night 时整块内容区（含页脚）一并套上 .lwg-night，
         否则暗色碑面会像浮在浅色底上的一块补丁，页脚文字也会读不清。 -->
    <div class="body" :class="{ 'lwg-night': night }">
      <main class="body__main">
        <slot />
      </main>

      <footer class="foot">
        <span>灵务阁 · 凡有所求 · 皆可悬赏</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Expand, Fold, SwitchButton, House, User, Trophy } from '@element-plus/icons-vue'

defineProps({
  // 各页面的副题（顶栏品牌区第二行）
  subtitle: { type: String, default: '宗门悬赏 · 灵脉账务' },
  // 天道碑页为暗色，交由插槽容器一并切换底纹
  night: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

const navItems = [
  { path: '/mission-hall', label: '任务大厅', icon: House },
  { path: '/dashboard', label: '个人中心', icon: User },
  { path: '/rank', label: '天道碑', icon: Trophy }
]

const isActive = (path) => route.path === path

const closeMenu = () => { menuOpen.value = false }

// 路由一变就收起窄屏菜单，避免切页后菜单仍挂着
watch(() => route.path, closeMenu)

const handleLogout = async () => {
  closeMenu()
  try {
    await ElMessageBox.confirm('退出后需重新出示令牌方可入阁，确定退隐？', '退隐山林', {
      confirmButtonText: '确认退隐',
      cancelButtonText: '再留一会',
      type: 'warning'
    })
  } catch {
    return // 用户取消
  }
  localStorage.removeItem('lwg_user_id')
  router.push('/login')
}
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--lwg-paper);
}

/* ---------- 顶部栏 ---------- */
.bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--lwg-paper-3);
  border-bottom: 1px solid var(--lwg-line);
  border-top: 2px solid var(--lwg-cinnabar); /* 朱砂压顶一线 */
}
.bar__inner {
  max-width: var(--lwg-shell-max);
  margin: 0 auto;
  padding: 0 var(--lwg-sp-5);
  height: var(--lwg-header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lwg-sp-4);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  min-width: 0;
}
.brand__seal {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: var(--lwg-cinnabar);
  color: var(--lwg-on-accent);
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  border-radius: var(--lwg-radius);
  transform: rotate(-3deg);
  transition: transform .25s ease;
}
.brand:hover .brand__seal { transform: rotate(0deg); }
.brand__text { display: flex; flex-direction: column; min-width: 0; }
.brand__name {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--lwg-ink);
  line-height: 1.2;
}
.brand__sub {
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-3);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 横向导航 ---------- */
.nav { display: flex; align-items: center; gap: var(--lwg-sp-1); }
.nav__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: var(--lwg-radius);
  color: var(--lwg-ink-2);
  font-family: var(--lwg-font-body);
  font-size: var(--lwg-fs-base);
  text-decoration: none;
  cursor: pointer;
  position: relative;
  transition: color .18s ease, background-color .18s ease;
}
.nav__item:hover { color: var(--lwg-cinnabar); background: var(--lwg-cinnabar-wash); }
.nav__item.is-active { color: var(--lwg-cinnabar); font-weight: 700; }
.nav__item.is-active::after {
  content: '';
  position: absolute;
  left: 10px; right: 10px; bottom: -1px;
  height: 2px;
  background: var(--lwg-cinnabar);
}
.nav__icon { font-size: 15px; }
.nav__item--quit { color: var(--lwg-ink-3); }
.nav__item--quit:hover { color: var(--lwg-danger); background: var(--lwg-cinnabar-wash); }

/* ---------- 窄屏汉堡 ---------- */
.burger {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  background: transparent;
  color: var(--lwg-ink-2);
  font-size: 17px;
  cursor: pointer;
}
.burger:hover { border-color: var(--lwg-cinnabar); color: var(--lwg-cinnabar); }

.drawer { display: none; }
.drawer__panel {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--lwg-line);
  background: var(--lwg-paper-3);
  padding: var(--lwg-sp-1) 0 var(--lwg-sp-2);
}
.drawer__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px var(--lwg-sp-5);
  border: none;
  background: transparent;
  color: var(--lwg-ink-2);
  font-family: var(--lwg-font-body);
  font-size: var(--lwg-fs-base);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.drawer__item.is-active {
  color: var(--lwg-cinnabar);
  font-weight: 700;
  background: var(--lwg-cinnabar-wash);
  box-shadow: inset 2px 0 0 var(--lwg-cinnabar);
}
.drawer__item--quit { color: var(--lwg-ink-3); }

.drawer-enter-active, .drawer-leave-active { transition: opacity .15s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }

/* ---------- 内容与页脚 ---------- */
.body { flex: 1; background: var(--lwg-paper); }
.body__main { min-height: 100%; }
.foot {
  max-width: var(--lwg-shell-max);
  width: 100%;
  /* 本项目的全局 reset 不含 border-box，这里必须显式声明：
     否则 width:100% + padding 会在窄屏撑出横向滚动条。 */
  box-sizing: border-box;
  margin: 0 auto;
  padding: var(--lwg-sp-5);
  border-top: 1px dashed var(--lwg-line);
  color: var(--lwg-ink-3);
  font-size: var(--lwg-fs-xs);
  letter-spacing: 1px;
  text-align: center;
}

/* ---------- 响应式：< 960px 导航折叠为图标 + 汉堡菜单 ---------- */
@media (max-width: 960px) {
  .nav { display: none; }
  .burger { display: inline-flex; }
  .drawer { display: flex; }
  .bar__inner { padding: 0 var(--lwg-sp-4); height: 56px; }
}
@media (max-width: 640px) {
  .brand__sub { display: none; }
  .bar__inner { padding: 0 var(--lwg-sp-3); }
  .foot { padding: var(--lwg-sp-4) var(--lwg-sp-3); }
}
</style>
