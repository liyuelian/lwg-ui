<template>
  <section class="frozen">
    <header class="frozen__head">
      <div class="frozen__title">
        <span class="frozen__mark" aria-hidden="true">冻</span>
        <div>
          <h3>冻结中</h3>
          <p class="frozen__hint">当前压在未结算悬赏上的押金，完结后扣除或退回</p>
        </div>
      </div>

      <div class="frozen__sum">
        <span class="lwg-num frozen__total">{{ data.totalFrozen ?? userFrozen }}</span>
        <span class="frozen__unit">灵石</span>
        <!-- 对账标记：不平衡用醒目样式，不用 toast -->
        <span
            v-if="data.items && data.items.length"
            class="flag"
            :class="data.balanced ? 'flag--ok' : 'flag--bad'"
        >
          {{ data.balanced ? '账目自洽' : `账目相差 ${data.diff}` }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="frozen__state">正在盘点…</div>

    <!-- 接口未开放 / 出错时降级为引导态，不弹 toast、不阻断页面 -->
    <div v-else-if="loadError" class="frozen__state frozen__state--guide">
      {{ loadError }}
      <button class="frozen__retry" type="button" @click="load">重试</button>
    </div>

    <div v-else-if="!items.length" class="frozen__state">
      当前没有冻结中的资金
    </div>

    <ul v-else class="items">
      <li v-for="it in items" :key="it.missionId" class="item">
        <div class="item__main">
          <span class="item__id lwg-mono lwg-muted">#{{ it.missionId }}</span>
          <span class="item__title">{{ it.title }}</span>
          <span :class="['lwg-status', `lwg-status--${it.status}`]">{{ it.statusDesc || statusText(it.status) }}</span>
        </div>
        <div class="item__meta">
          <span>冻结于 {{ formatDate(it.frozenAt) }}</span>
          <span v-if="it.deadline">· 截止 {{ formatDate(it.deadline) }}</span>
          <span v-if="it.difficultyDesc">· 难度 {{ it.difficultyDesc }}</span>
          <span v-if="it.counterpartyName">· 接单人 {{ it.counterpartyName }}</span>
        </div>
        <span class="item__amount lwg-num">{{ it.amount }}</span>
      </li>
    </ul>

    <!-- 对账面板：仅开发者模式显示，且错误就地渲染，不吞成 toast -->
    <div v-if="devMode" class="recon">
      <div class="recon__bar">
        <span class="recon__label">资金对账</span>
        <button class="frozen__retry" type="button" :disabled="reconLoading" @click="loadRecon">
          {{ reconLoading ? '核对中…' : '重新核对' }}
        </button>
      </div>
      <p v-if="reconError" class="recon__err">{{ reconError }}</p>
      <template v-else-if="recon">
        <p class="recon__flag" :class="recon.balanced ? 'is-ok' : 'is-bad'">
          {{ recon.balanced ? '全部等式成立' : '存在不平衡，详见下表（诊断接口只读，不会自动修账）' }}
        </p>
        <ul class="recon__list">
          <li v-for="u in recon.users || []" :key="`u${u.userId}`" :class="{ 'is-bad': !u.balanced }">
            道友 #{{ u.userId }}：可用 {{ u.balance }} / 流水 {{ u.balanceByLog }}；冻结 {{ u.frozenBalance }} / 流水 {{ u.frozenByLog }}
          </li>
          <li v-for="g in recon.global || []" :key="g.name" :class="{ 'is-bad': !g.balanced }">
            {{ g.name }}：左 {{ g.left }} / 右 {{ g.right }}（差 {{ g.diff }}）
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getFrozenList, getReconcile } from '../api/user'
import { errText } from '../utils/request'

const props = defineProps({
  userId: { type: Number, required: true },
  userFrozen: { type: Number, default: 0 },
  // 开发者模式：额外显示对账断言面板（/admin/reconcile）
  devMode: { type: Boolean, default: false }
})

const loading = ref(false)
const loadError = ref('')
const data = ref({ totalFrozen: 0, sumByMissions: 0, balanced: true, diff: 0, items: [] })

const reconLoading = ref(false)
const reconError = ref('')
const recon = ref(null)

const items = computed(() => data.value.items || [])

const statusText = (v) => ({ 0: '待接单', 1: '进行中', 2: '待验收' }[v] ?? '--')
const formatDate = (s) => (s ? String(s).replace('T', ' ').substring(0, 16) : '—')

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    // inlineError：接口未开放属可预期情况，就地展示而不是弹 toast
    data.value = (await getFrozenList(props.userId, { inlineError: true })) || data.value
  } catch (e) {
    loadError.value = `冻结明细接口暂不可用（${errText(e)}）`
  } finally {
    loading.value = false
  }
}

const loadRecon = async () => {
  reconLoading.value = true
  reconError.value = ''
  try {
    recon.value = await getReconcile(props.userId, { inlineError: true })
  } catch (e) {
    recon.value = null
    reconError.value = `对账接口暂不可用（${errText(e)}）`
  } finally {
    reconLoading.value = false
  }
}

onMounted(() => {
  load()
  if (props.devMode) loadRecon()
})
</script>

<style scoped>
.frozen { padding: var(--lwg-sp-4) var(--lwg-sp-5); }

.frozen__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--lwg-sp-3);
  flex-wrap: wrap;
  padding-bottom: var(--lwg-sp-3);
  border-bottom: 1px dashed var(--lwg-line);
}
.frozen__title { display: flex; align-items: center; gap: var(--lwg-sp-3); }
.frozen__mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: none;
  border: 1px solid var(--lwg-cinnabar);
  border-radius: var(--lwg-radius);
  color: var(--lwg-cinnabar);
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  transform: rotate(-3deg);
}
.frozen__title h3 {
  margin: 0;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  letter-spacing: 2px;
  color: var(--lwg-ink);
}
.frozen__hint { margin: 3px 0 0; font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

.frozen__sum { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.frozen__total { font-size: var(--lwg-fs-lg); color: var(--lwg-cinnabar); }
.frozen__unit { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.flag {
  margin-left: var(--lwg-sp-2);
  padding: 1px 8px;
  border-radius: var(--lwg-radius);
  border: 1px solid currentColor;
  font-size: var(--lwg-fs-xs);
}
.flag--ok { color: var(--lwg-success); }
.flag--bad { color: var(--lwg-danger); font-weight: 700; }

.frozen__state {
  padding: var(--lwg-sp-5) 0;
  text-align: center;
  color: var(--lwg-ink-3);
  font-size: var(--lwg-fs-sm);
}
.frozen__state--guide { line-height: 1.9; }
.frozen__retry {
  margin-left: 6px;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--lwg-cinnabar);
  font-size: var(--lwg-fs-sm);
  text-decoration: underline;
  cursor: pointer;
}

.items { list-style: none; margin: 0; padding: 0; }
.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px var(--lwg-sp-3);
  align-items: center;
  padding: var(--lwg-sp-3) 0;
  border-bottom: 1px dashed var(--lwg-line);
}
.item:last-child { border-bottom: none; }
.item__main { display: flex; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; min-width: 0; }
.item__id { font-size: var(--lwg-fs-xs); }
.item__title { font-size: var(--lwg-fs-base); color: var(--lwg-ink); }
.item__meta {
  grid-column: 1;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-3);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.item__amount {
  grid-row: 1 / span 2;
  grid-column: 2;
  font-size: var(--lwg-fs-md);
  color: var(--lwg-cinnabar);
}

/* ---------- 对账面板 ---------- */
.recon {
  margin-top: var(--lwg-sp-4);
  padding-top: var(--lwg-sp-3);
  border-top: 1px solid var(--lwg-line);
}
.recon__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--lwg-sp-3); }
.recon__label { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); letter-spacing: 2px; }
.recon__err { margin: var(--lwg-sp-2) 0 0; font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.recon__flag { margin: var(--lwg-sp-2) 0; font-size: var(--lwg-fs-sm); }
.recon__flag.is-ok { color: var(--lwg-success); }
.recon__flag.is-bad { color: var(--lwg-danger); font-weight: 700; }
.recon__list { list-style: none; margin: 0; padding: 0; }
.recon__list li {
  padding: 4px 0;
  font-family: var(--lwg-font-mono);
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-2);
}
.recon__list li.is-bad { color: var(--lwg-danger); }

@media (max-width: 640px) {
  .frozen { padding: var(--lwg-sp-4); }
  .frozen__sum { width: 100%; }
}
</style>
