<template>
  <AppLayout subtitle="宗门排名 · 天道昭昭" night>
    <!-- .lwg-night 只在榜单页内生效，离开路由即随之卸载，不污染其他页面 -->
    <div class="night lwg-night">
      <div class="page">
        <div class="lwg-page-head">
          <div>
            <h1 class="lwg-page-title">天道碑</h1>
            <p class="lwg-page-sub">功过昭然 · 名次自证</p>
          </div>
          <div class="head-actions">
            <span class="meta-line">
              {{ board.scoreLabel || '分值' }} · 前 {{ board.items.length || items.length }} 位
              <template v-if="board.generatedAt"> · {{ formatTime(board.generatedAt) }} 生成</template>
            </span>
            <button class="lwg-btn lwg-btn--outline lwg-btn--sm" type="button" :disabled="loading" @click="reload">
              {{ loading ? '推演中…' : '重推天机' }}
            </button>
          </div>
        </div>

        <!-- ============ Tab：信誉榜 / 接单王榜，含总榜与月榜 ============ -->
        <el-tabs v-model="activeTab" class="board-tabs" @tab-change="handleTabChange">
          <el-tab-pane name="reputation">
            <template #label>
              <span class="tab-label">信誉榜<span class="tab-sub">总榜</span></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="acceptor">
            <template #label>
              <span class="tab-label">接单王榜<span class="tab-sub">总榜</span></span>
            </template>
          </el-tab-pane>
          <!-- 月榜依赖后端 t_mission.finish_time 落库（requirement-ranking.md D1），
               未启用前后端以 400 拒绝，故此处直接置灰并给出说明，不制造报错。 -->
          <el-tab-pane name="acceptor-month" disabled>
            <template #label>
              <el-tooltip
                  content="月榜依赖后端 finish_time 落库（当前尚未启用），开放后自动点亮"
                  placement="bottom"
              >
                <span class="tab-label is-disabled">接单王榜<span class="tab-sub">月榜</span></span>
              </el-tooltip>
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- ============ 榜单主体 ============ -->
        <div v-loading="loading" class="board lwg-card">
          <!-- 后端榜单接口尚未落地时的引导态，不是报错 -->
          <div v-if="loadError" class="lwg-empty">
            <span class="lwg-empty__mark">碑</span>
            天道碑尚未开启：{{ loadError }}
            <br />
            碑文需待后端榜单接口（/api/rank/board）开放后方可刻录。
          </div>

          <ol v-else-if="items.length" class="rows">
            <li
                v-for="item in items"
                :key="item.userId"
                class="row"
                :class="[{ 'is-me': item.userId === myUserId }, topClass(item.rank)]"
            >
              <span class="row__rank">
                <span v-if="item.rank <= 3" class="medal">{{ item.rank }}</span>
                <span v-else class="rank-num">{{ item.rank }}</span>
              </span>

              <span class="row__who">
                <span class="row__name">
                  {{ item.username || '无名道友' }}
                  <span v-if="item.userId === myUserId" class="me-tag">我</span>
                </span>
                <span class="row__realm">{{ item.realmDesc || realmText(item.realm) || '境界未明' }}</span>
              </span>

              <span class="row__extra lwg-muted">{{ item.extra || '' }}</span>

              <span class="row__score">
                <span class="lwg-num score">{{ item.score }}</span>
                <span class="score-label">{{ board.scoreLabel || '分值' }}</span>
              </span>
            </li>
          </ol>

          <div v-else class="lwg-empty">
            <span class="lwg-empty__mark">碑</span>
            碑上尚无刻名，完成第一单即可上榜
          </div>
        </div>

        <!-- ============ 我的名次（吸底卡片） ============ -->
        <div class="mine lwg-card">
          <template v-if="mine.ranked">
            <span class="mine__label">我的名次</span>
            <span class="mine__rank">#{{ mine.rank }}</span>
            <span class="mine__sep" aria-hidden="true">·</span>
            <span class="lwg-num mine__score">{{ mine.score }}</span>
            <span class="mine__label">{{ mine.scoreLabel || board.scoreLabel || '分值' }}</span>
            <span v-if="mine.gapHint" class="mine__gap">{{ mine.gapHint }}</span>
            <span v-else class="mine__gap mine__gap--top">已居榜首，无人可越</span>
          </template>

          <!-- ranked=false 时给引导文案，不显示空态或报错 -->
          <template v-else>
            <span class="mine__label">我的名次</span>
            <span class="mine__gap">
              {{ mine.gapHint || (pending
                ? '正在推演你的名次…'
                : (mineError || '完成第一单即可上榜')) }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { getRankBoard, getMyRank } from '../api/rank'
import { errText } from '../utils/request'

const myUserId = Number(localStorage.getItem('lwg_user_id'))

const REALMS = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期']
const realmText = (val) => REALMS[val - 1] || ''

const activeTab = ref('reputation')
const loading = ref(false)
const pending = ref(false)
const loadError = ref('')
const mineError = ref('')
const board = ref({ items: [], scoreLabel: '', generatedAt: '' })
const mine = ref({ ranked: false, rank: null, score: null, scoreLabel: '', gapHint: '' })

const items = computed(() => board.value.items || [])

const typeOf = (tab) => (tab === 'reputation' ? 'reputation' : 'acceptor')

const topClass = (rank) => (rank === 1 ? 'is-top1' : rank === 2 ? 'is-top2' : rank === 3 ? 'is-top3' : '')

const formatTime = (s) => (s ? String(s).replace('T', ' ').substring(0, 16) : '')

const loadBoard = async () => {
  const type = typeOf(activeTab.value)
  loading.value = true
  pending.value = true
  loadError.value = ''
  mineError.value = ''

  try {
    board.value = (await getRankBoard({ type, period: 'all', limit: 20 }, { inlineError: true })) || { items: [] }
  } catch (e) {
    board.value = { items: [], scoreLabel: '' }
    loadError.value = errText(e, '榜单接口不可用')
  } finally {
    loading.value = false
  }

  try {
    mine.value = (await getMyRank({ userId: myUserId, type, period: 'all' }, { inlineError: true })) || { ranked: false }
  } catch (e) {
    mine.value = { ranked: false, rank: null, score: null, gapHint: '' }
    mineError.value = errText(e, '名次暂不可查')
  } finally {
    pending.value = false
  }
}

const reload = () => loadBoard()
const handleTabChange = () => loadBoard()

onMounted(loadBoard)
</script>

<style scoped>
.night {
  min-height: 100%;
  background: var(--lwg-paper);
  color: var(--lwg-ink);
}

.page {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--lwg-sp-6) var(--lwg-sp-5) var(--lwg-sp-7);
}

.head-actions { display: flex; align-items: center; gap: var(--lwg-sp-3); flex-wrap: wrap; }
.meta-line { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); letter-spacing: 1px; }

/* ---------- Tabs ---------- */
.tab-label { font-size: var(--lwg-fs-base); letter-spacing: 1px; }
.tab-sub {
  margin-left: 6px;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-3);
  border: 1px solid var(--lwg-line-strong);
  border-radius: var(--lwg-radius);
  padding: 0 4px;
}
.tab-label.is-disabled { color: var(--lwg-ink-3); }

/* Element tabs 在暗色下的局部覆盖 */
:deep(.board-tabs .el-tabs__header) { margin-bottom: var(--lwg-sp-5); }
:deep(.board-tabs .el-tabs__nav-wrap::after) { background-color: var(--lwg-line); height: 1px; }
:deep(.board-tabs .el-tabs__item) {
  color: var(--lwg-ink-3);
  font-family: var(--lwg-font-display);
  letter-spacing: 2px;
  padding: 0 var(--lwg-sp-4) 0 0;
}
:deep(.board-tabs .el-tabs__item.is-active) { color: var(--lwg-gold); }
:deep(.board-tabs .el-tabs__item:hover) { color: var(--lwg-ink); }
:deep(.board-tabs .el-tabs__item.is-disabled) { color: var(--lwg-ink-3); }
:deep(.board-tabs .el-tabs__active-bar) { background-color: var(--lwg-gold); }

/* ---------- 榜单 ---------- */
.board { overflow: hidden; }
.rows { list-style: none; margin: 0; padding: 0; }

.row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(0, 200px) auto;
  align-items: center;
  gap: var(--lwg-sp-3);
  padding: var(--lwg-sp-3) var(--lwg-sp-4);
  border-bottom: 1px solid var(--lwg-line);
  transition: background-color .18s ease;
}
.row:last-child { border-bottom: none; }
.row:hover { background: rgba(212, 175, 106, .05); }

/* 当前用户所在行高亮 */
.row.is-me {
  background: var(--lwg-cinnabar-wash);
  box-shadow: inset 2px 0 0 var(--lwg-gold);
}

.row__rank { display: flex; justify-content: center; }
.rank-num {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  color: var(--lwg-ink-3);
  font-variant-numeric: tabular-nums;
}
.medal {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-sm);
  font-weight: 700;
  color: var(--lwg-paper);
}
/* Top3 徽记：金 / 银 / 铜 */
.is-top1 .medal {
  background: var(--lwg-medal-1);
  box-shadow: 0 0 0 3px var(--lwg-glow), 0 0 12px var(--lwg-glow);
}
.is-top2 .medal { background: var(--lwg-medal-2); box-shadow: 0 0 0 3px var(--lwg-glow); }
.is-top3 .medal { background: var(--lwg-medal-3); box-shadow: 0 0 0 3px var(--lwg-glow); }
.is-top1 .row__name { color: var(--lwg-gold); }

.row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.row__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  color: var(--lwg-ink);
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me-tag {
  flex: none;
  font-family: var(--lwg-font-body);
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-paper);
  background: var(--lwg-gold);
  border-radius: var(--lwg-radius);
  padding: 0 4px;
}
.row__realm { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

.row__extra {
  font-size: var(--lwg-fs-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__score { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.score { font-size: var(--lwg-fs-lg); color: var(--lwg-gold); letter-spacing: 1px; }
.is-top1 .score { color: var(--lwg-medal-1-bright); }
.score-label { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

/* ---------- 我的名次（吸底） ---------- */
.mine {
  position: sticky;
  bottom: var(--lwg-sp-3);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--lwg-sp-2);
  flex-wrap: wrap;
  margin-top: var(--lwg-sp-4);
  padding: var(--lwg-sp-3) var(--lwg-sp-4);
  background: var(--lwg-paper-2);
  border-color: var(--lwg-line-strong);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, .35);
}
.mine__label { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); letter-spacing: 1px; }
.mine__rank {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  font-weight: 700;
  color: var(--lwg-gold);
  letter-spacing: 1px;
}
.mine__sep { color: var(--lwg-line-strong); }
.mine__score { font-size: var(--lwg-fs-lg); color: var(--lwg-ink); }
.mine__gap { font-size: var(--lwg-fs-sm); color: var(--lwg-ink-2); margin-left: var(--lwg-sp-2); }
.mine__gap--top { color: var(--lwg-gold); }

/* ---------- 响应式 ---------- */
@media (max-width: 960px) {
  .page { padding: var(--lwg-sp-5) var(--lwg-sp-4) var(--lwg-sp-6); }
  .row { grid-template-columns: 44px minmax(0, 1fr) auto; row-gap: 4px; }
  .row__extra { grid-column: 2 / -1; }
}
@media (max-width: 640px) {
  .page { padding: var(--lwg-sp-4) var(--lwg-sp-3) var(--lwg-sp-6); }
  .head-actions { width: 100%; justify-content: space-between; }
  .row { grid-template-columns: 38px minmax(0, 1fr) auto; padding: var(--lwg-sp-3); gap: var(--lwg-sp-2); }
  .score { font-size: var(--lwg-fs-md); }
  .mine { position: static; }
  .mine__gap { margin-left: 0; width: 100%; }
}
</style>
