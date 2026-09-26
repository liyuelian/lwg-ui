<template>
  <el-dialog
    v-model="visible"
    class="rank-scroll-dialog"
    width="min(840px, calc(100vw - 24px))"
    align-center
    append-to-body
    :show-close="false"
    @closed="requestVersion++"
  >
    <template #header>
      <header class="rank-heading">
        <button class="close-button" type="button" aria-label="关闭天道碑" @click="visible = false">×</button>
        <p class="eyebrow">众修竞逐 · 留名于碑</p>
        <h2>天道碑</h2>
        <p class="intro">一诺千金，百炼成名。你的每一份功绩，皆有回响。</p>
      </header>
    </template>

    <section class="rank-content" aria-label="修士排行榜" :aria-busy="loading">
      <div class="board-toolbar">
        <div class="board-tabs" aria-label="榜单类型">
          <button v-for="tab in tabs" :key="tab.value" type="button" :aria-pressed="type === tab.value"
                  :class="{ active: type === tab.value }" @click="switchTab(tab.value)">{{ tab.label }}</button>
        </div>
        <button class="refresh" type="button" :disabled="loading" @click="loadBoard">{{ loading ? '刻录中…' : '刷新 ↻' }}</button>
      </div>
      <div class="board-meta"><span>总榜 · 前 50 位道友</span><span v-if="board && !loading && !error">{{ board.total }} 位修士上榜</span></div>

      <div v-if="loading" class="state" role="status">正在读取碑文…</div>
      <div v-else-if="error" class="state" role="alert">
        <strong>碑文暂未载入</strong><p>{{ error }}</p><button class="retry" type="button" @click="loadBoard">重新读取</button>
      </div>
      <div v-else-if="!board?.entries.length" class="state">
        <strong>碑上尚无名，待君来落笔</strong>
        <p>{{ type === 'completed' ? '完成一份悬赏并通过验收，即可参与排名。' : '暂无符合上榜条件的修士。' }}</p>
      </div>
      <template v-else>
        <div class="podium" aria-label="榜首修士">
          <article v-for="entry in leaders" :key="entry.userId" class="leader" :class="`place-${entry.rank}`">
            <span class="leader-title">{{ entry.rank === 1 ? '榜首' : `第 ${entry.rank} 名` }}</span>
            <span class="leader-avatar" aria-hidden="true">{{ Array.from(entry.username || '?')[0] }}</span>
            <h3>{{ entry.username }} <small v-if="entry.userId === myUserId">我</small></h3>
            <span class="realm">{{ realmText(entry.realm) }}</span>
            <p class="leader-score">{{ formatScore(entry.score) }} <span>{{ unit }}</span></p>
          </article>
        </div>
        <table class="rank-table">
          <caption class="sr-only">{{ currentTab.label }}，同分并列，后续名次跳号</caption>
          <thead><tr><th scope="col">名次</th><th scope="col">道友</th><th scope="col" class="realm-column">境界</th><th scope="col">{{ scoreLabel }}</th></tr></thead>
          <tbody>
            <tr v-for="entry in board.entries" :key="entry.userId" :class="{ 'my-row': entry.userId === myUserId }">
              <td><span class="rank-number" :class="{ 'top-rank': entry.rank <= 3 }">{{ entry.rank }}</span></td>
              <td class="name-cell">{{ entry.username }} <span v-if="entry.userId === myUserId" class="me-label">我</span><span class="mobile-realm">{{ realmText(entry.realm) }}</span></td>
              <td class="realm-column">{{ realmText(entry.realm) }}</td>
              <td class="score-cell">{{ formatScore(entry.score) }} <small>{{ unit }}</small></td>
            </tr>
          </tbody>
        </table>
      </template>
      <aside class="rules"><strong>碑文规则</strong><p>{{ currentTab.rule }} 同分并列（如 1、1、3），同分道友按 ID 升序展示；仅正常状态账号参与排名。</p><p v-if="type === 'reputation'">信誉在任务结算后的消息处理完成后更新，可稍后刷新查看。</p></aside>
      <footer v-if="board && !loading && !error" class="my-rank" aria-live="polite">
        <div><span class="my-label">我的名次</span><strong>{{ board.myRank ? `第 ${board.myRank.rank} 名` : '尚未上榜' }}</strong></div>
        <span v-if="board.myRank">{{ formatScore(board.myRank.score) }} {{ unit }}<small v-if="!isVisible"> · 当前未展示在前 50 位中</small></span>
        <span v-else class="unranked">{{ type === 'completed' ? '完成悬赏并通过验收，留下你的名字。' : '当前账号暂无上榜记录。' }}</span>
      </footer>
    </section>
  </el-dialog>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { getRankBoard } from '../api/rank'
import { formatReputation } from '../utils/reputation'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const tabs = [
  { value: 'reputation', label: '信誉榜', rule: '按当前信誉值从高到低排名，初始信誉为 60.00。' },
  { value: 'completed', label: '悬赏完成榜', rule: '按作为接单者完成并通过验收的悬赏数量排名；至少完成一单才可上榜，进行中、待验收和已取消的任务不计入。' }
]
const myUserId = Number(localStorage.getItem('lwg_user_id'))
const type = ref('reputation')
const board = ref(null)
const loading = ref(false)
const error = ref('')
let requestVersion = 0
const currentTab = computed(() => tabs.find(tab => tab.value === type.value))
const unit = computed(() => type.value === 'reputation' ? '分' : '单')
const scoreLabel = computed(() => type.value === 'reputation' ? '信誉值' : '完成悬赏')
const leaders = computed(() => board.value?.entries.slice(0, 3) || [])
const isVisible = computed(() => board.value?.entries.some(entry => entry.userId === myUserId))
const realmText = realm => ['凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'][realm] || '境界未知'
const formatScore = score => type.value === 'reputation' ? formatReputation(score) : Number(score).toLocaleString('zh-CN')

async function loadBoard() {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  board.value = null
  try {
    const data = await getRankBoard({ type: type.value, limit: 50, userId: myUserId })
    if (version === requestVersion) board.value = data
  } catch (err) {
    if (version === requestVersion) error.value = err.message || '请稍后重试'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
function switchTab(value) {
  if (type.value === value) return
  type.value = value
  loadBoard()
}
watch(() => props.modelValue, open => {
  if (open) loadBoard()
  else requestVersion++
})
onUnmounted(() => { requestVersion++ })
</script>

<style>
.rank-scroll-dialog { --rank-ink: #3e2723; --rank-muted: #8d6e63; --rank-line: #d7ccc8; --rank-accent: #3e2723; margin: 24px auto; padding: 0 !important; background: #fdfbf7 !important; color: var(--rank-ink); border: 1px solid #efeadd; border-radius: 2px; box-shadow: 0 10px 40px rgba(0,0,0,.15); animation: unroll-rank-scroll .6s cubic-bezier(.2,.8,.2,1) both; }
.rank-scroll-dialog * { box-sizing: border-box; }
.rank-scroll-dialog button { font: inherit; cursor: pointer; }
.rank-scroll-dialog button:focus-visible { outline: 2px solid var(--rank-accent); outline-offset: 3px; }
.rank-scroll-dialog .el-dialog__header { padding: 0; margin: 0; }
.rank-scroll-dialog .el-dialog__body { padding: 0; }
.rank-heading { text-align: center; position: relative; padding: 30px 40px 20px; margin-bottom: 10px; }
.rank-heading .eyebrow { margin: 0 0 8px; color: var(--rank-muted); letter-spacing: 4px; font-size: 12px; }
.rank-heading h2 { margin: 0; color: #3e2723; font: bold 28px 'Noto Serif SC', 'Songti SC', serif; letter-spacing: 10px; padding-left: 10px; }
.rank-heading .intro { margin: 8px 0 0; color: var(--rank-muted); font-size: 13px; }
.rank-scroll-dialog .close-button { position: absolute; right: 20px; top: 10px; border: 0; background: none; color: #a1887f; font-size: 24px; line-height: 1; }
.rank-scroll-dialog .close-button:hover { color: var(--rank-accent); }
.rank-content { max-height: min(68vh, 700px); overflow-y: auto; padding: 0 30px 24px; }
.rank-scroll-dialog .board-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid var(--rank-line); }
.rank-scroll-dialog .board-tabs { display: flex; gap: 26px; }
.rank-scroll-dialog .board-tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--rank-muted); padding: 17px 0 12px; white-space: nowrap; }
.rank-scroll-dialog .board-tabs button.active { color: var(--rank-accent); border-bottom-color: var(--rank-accent); font-weight: 600; }
.rank-scroll-dialog .refresh { border: 1px solid var(--rank-line); border-radius: 2px; background: transparent; color: var(--rank-ink); padding: 5px 10px; font-size: 12px; white-space: nowrap; }
.rank-scroll-dialog .refresh:disabled { opacity: .6; cursor: wait; }
.rank-scroll-dialog .board-meta { display: flex; justify-content: space-between; gap: 12px; padding: 14px 0; color: var(--rank-muted); font-size: 12px; }
.rank-scroll-dialog .podium { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
.rank-scroll-dialog .leader { --medal: #3e2723; min-width: 0; padding: 13px 8px 9px; text-align: center; background: transparent; border: 1px solid var(--rank-line); }
.rank-scroll-dialog .place-2, .rank-scroll-dialog .place-3 { --medal: #8d6e63; }
.rank-scroll-dialog .leader-title { color: var(--medal); font-size: 12px; letter-spacing: 2px; }
.rank-scroll-dialog .leader-avatar { display: grid; place-items: center; width: 38px; height: 38px; margin: 9px auto 6px; border: 1px solid var(--medal); border-radius: 50%; color: var(--medal); font: 20px 'Noto Serif SC', serif; }
.rank-scroll-dialog .leader h3 { margin: 0; font-size: 14px; overflow-wrap: anywhere; }
.rank-scroll-dialog .leader h3 small, .rank-scroll-dialog .me-label { color: var(--rank-accent); font-size: 11px; margin-left: 4px; }
.rank-scroll-dialog .realm { font-size: 11px; color: var(--rank-muted); }
.rank-scroll-dialog .leader-score { color: var(--medal); font-size: 22px; font-variant-numeric: tabular-nums; margin: 7px 0 0; }
.rank-scroll-dialog .leader-score span { font-size: 12px; }
.rank-scroll-dialog .rank-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; }
.rank-scroll-dialog th, .rank-scroll-dialog td { text-align: left; padding: 11px 12px; border-top: 1px solid var(--rank-line); overflow-wrap: anywhere; }
.rank-scroll-dialog th { background: #f7f4ef; color: var(--rank-muted); font-weight: normal; }
.rank-scroll-dialog th:first-child { width: 68px; }.rank-scroll-dialog th:nth-child(2) { width: 40%; }.rank-scroll-dialog th:last-child, .rank-scroll-dialog td:last-child { text-align: right; }
.rank-scroll-dialog .realm-column, .rank-scroll-dialog .rank-number { color: var(--rank-muted); }.rank-scroll-dialog .top-rank { color: var(--rank-accent); }
.rank-scroll-dialog .score-cell { font-variant-numeric: tabular-nums; }.rank-scroll-dialog .score-cell small { color: var(--rank-muted); font-size: 11px; }
.rank-scroll-dialog .my-row { background: #f7f2ee; }.rank-scroll-dialog .mobile-realm { display: none; }
.rank-scroll-dialog .rules { padding: 15px 0 0; color: var(--rank-muted); font-size: 12px; line-height: 1.7; }.rank-scroll-dialog .rules strong { color: var(--rank-accent); }.rank-scroll-dialog .rules p { margin: 4px 0; }
.rank-scroll-dialog .my-rank { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 13px 16px; margin-top: 14px; border: 1px solid var(--rank-line); background: transparent; font-size: 13px; }
.rank-scroll-dialog .my-label { color: var(--rank-muted); margin-right: 12px; }.rank-scroll-dialog .my-rank strong { color: var(--rank-accent); }.rank-scroll-dialog .unranked { color: var(--rank-muted); }
.rank-scroll-dialog .state { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; color: var(--rank-muted); }.rank-scroll-dialog .state p { margin: 0; }.rank-scroll-dialog .state strong { color: var(--rank-ink); }
.rank-scroll-dialog .retry { border: 1px solid var(--rank-accent); background: transparent; color: var(--rank-accent); padding: 6px 14px; }
.rank-scroll-dialog .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@keyframes unroll-rank-scroll { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(-20% -20% -20% -20%); } }
@media (max-width: 640px) {
  .rank-scroll-dialog { margin: 15px auto; }.rank-heading { padding: 22px 18px 16px; }.rank-heading h2 { font-size: 28px; }.rank-heading .intro { font-size: 11px; }
  .rank-content { max-height: 72vh; padding: 0 12px 18px; }.rank-scroll-dialog .board-tabs { gap: 12px; }.rank-scroll-dialog .board-tabs button { font-size: 13px; }
  .rank-scroll-dialog .podium { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 5px; }.rank-scroll-dialog .leader { padding: 10px 3px 7px; }.rank-scroll-dialog .leader h3 { font-size: 12px; }.rank-scroll-dialog .leader-score { font-size: 16px; }.rank-scroll-dialog .leader-score span { display: block; }
  .rank-scroll-dialog th, .rank-scroll-dialog td { padding: 9px 5px; }.rank-scroll-dialog th:first-child { width: 42px; }.rank-scroll-dialog th:nth-child(2) { width: 47%; }.rank-scroll-dialog .realm-column { display: none; }.rank-scroll-dialog .mobile-realm { display: block; color: var(--rank-muted); font-size: 10px; margin-top: 3px; }
}
@media (prefers-reduced-motion: reduce) { .rank-scroll-dialog { animation: none; } }
</style>
