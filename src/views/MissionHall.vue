<template>
  <AppLayout subtitle="凡有所求 · 皆可悬赏">
    <div class="page">
      <div class="lwg-page-head">
        <div>
          <h1 class="lwg-page-title">任务大厅</h1>
          <p class="lwg-page-sub">凡有所求 · 皆可悬赏</p>
        </div>
        <div class="head-actions">
          <button class="lwg-btn lwg-btn--outline lwg-btn--sm" type="button" :disabled="loading" @click="loadData">
            {{ loading ? '载入中…' : '刷新榜单' }}
          </button>
          <button class="lwg-btn lwg-btn--primary" type="button" @click="openPublishDialog">+ 发布悬赏</button>
        </div>
      </div>

      <div class="lwg-tabs" role="tablist">
        <div
            v-for="tab in statusTabs"
            :key="tab.value"
            class="lwg-tab"
            :class="{ 'is-active': queryParams.status === tab.value }"
            role="tab"
            :aria-selected="queryParams.status === tab.value ? 'true' : 'false'"
            @click="handleSwitchTab(tab.value)"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- 本页刚变更过状态的任务：原位变更而非整页刷新，这里给出同步入口 -->
      <div v-if="changedIds.size" class="sync-bar">
        <span>{{ changedIds.size }} 条任务状态已变更，当前视图尚未同步。</span>
        <button class="sync-bar__btn" type="button" @click="loadData">立即同步</button>
      </div>

      <!-- ============ 宽屏：表格（>= 960px） ============ -->
      <el-table
          v-if="!isNarrow"
          :data="pagedData"
          style="width: 100%"
          v-loading="loading"
          class="hall-table"
          row-key="id"
          :row-class-name="rowClass"
      >
        <el-table-column label="编号" width="76" align="center">
          <template #default="{ row }">
            <span class="lwg-mono lwg-muted">#{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="任务标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <span v-if="row.publisherId === myUserId" class="owner-badge">我发布的</span>
              <span class="mission-title">{{ row.title }}</span>
            </div>
            <div v-if="feedback[row.id]" class="lwg-inline-error" :class="{ 'is-fading': true }">
              {{ feedback[row.id] }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="概览" min-width="150">
          <template #default="{ row }">
            <span class="lwg-muted brief">{{ brief(row.description) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="赏金" width="110" align="right">
          <template #default="{ row }">
            <span class="lwg-num reward">{{ row.reward }}</span>
            <span class="lwg-muted unit"> 灵石</span>
          </template>
        </el-table-column>

        <el-table-column label="截止时间" width="160" align="center">
          <template #default="{ row }">
            <span class="lwg-mono lwg-muted time">{{ formatDate(row.deadline) || '无期限' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="最低要求" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ realmText(row.minRealm) || '不限' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="96" align="center">
          <template #default="{ row }">
            <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" align="center">
          <template #default="{ row }">
            <div class="op-group">
              <button class="lwg-btn lwg-btn--outline lwg-btn--sm" type="button" @click="openDetailDialog(row)">详情</button>
              <button
                  v-if="canAccept(row)"
                  class="lwg-btn lwg-btn--primary lwg-btn--sm"
                  type="button"
                  :disabled="acceptingId === row.id"
                  @click="handleAccept(row)"
              >
                {{ acceptingId === row.id ? '接榜中…' : '接榜' }}
              </button>
              <button
                  v-if="canCancel(row)"
                  class="lwg-btn lwg-btn--danger lwg-btn--sm"
                  type="button"
                  @click="handleCancel(row)"
              >
                撤榜
              </button>
              <span v-if="!canAccept(row) && !canCancel(row)" class="lwg-dash">--</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- ============ 窄屏：卡片流（< 960px） ============ -->
      <div v-else class="card-flow" v-loading="loading">
        <article
            v-for="row in pagedData"
            :key="row.id"
            class="mission-card lwg-card"
            :class="{ 'is-changed': changedIds.has(row.id) }"
        >
          <div class="mission-card__head">
            <span class="lwg-mono lwg-muted">#{{ row.id }}</span>
            <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
          </div>

          <h3 class="mission-card__title">
            <span v-if="row.publisherId === myUserId" class="owner-badge">我发布的</span>
            {{ row.title }}
          </h3>
          <p class="mission-card__desc">{{ brief(row.description, 52) }}</p>

          <dl class="mission-card__meta">
            <div><dt>赏金</dt><dd class="lwg-num reward">{{ row.reward }} 灵石</dd></div>
            <div><dt>最低境界</dt><dd>{{ realmText(row.minRealm) || '不限' }}</dd></div>
            <div><dt>截止</dt><dd class="lwg-mono">{{ formatDate(row.deadline) || '无期限' }}</dd></div>
          </dl>

          <div class="mission-card__ops">
            <button class="lwg-btn lwg-btn--outline lwg-btn--sm" type="button" @click="openDetailDialog(row)">详情</button>
            <button
                v-if="canAccept(row)"
                class="lwg-btn lwg-btn--primary lwg-btn--sm"
                type="button"
                :disabled="acceptingId === row.id"
                @click="handleAccept(row)"
            >
              {{ acceptingId === row.id ? '接榜中…' : '接榜' }}
            </button>
            <button
                v-if="canCancel(row)"
                class="lwg-btn lwg-btn--danger lwg-btn--sm"
                type="button"
                @click="handleCancel(row)"
            >
              撤榜
            </button>
          </div>

          <p v-if="feedback[row.id]" class="lwg-inline-error is-fading">{{ feedback[row.id] }}</p>
        </article>

        <div v-if="!loading && !tableData.length" class="lwg-empty lwg-card">
          <span class="lwg-empty__mark">空</span>
          此榜暂无任务
        </div>
      </div>

      <!-- 分页：前端先做，后端 selectList 支持分页后再对齐 -->
      <div v-if="total > 0" class="pager">
        <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            :pager-count="5"
            :layout="isNarrow ? 'prev, pager, next' : 'total, prev, pager, next'"
            background
        />
      </div>

      <!-- ================= 发布悬赏（悬赏令） ================= -->
      <el-dialog
          v-model="publishDialogVisible"
          width="650px"
          class="paper-dialog"
          :show-close="false"
          align-center
          destroy-on-close
      >
        <template #header>
          <div class="paper-header">
            <div class="paper-title">宗 门 悬 赏 令</div>
            <button class="close-icon" type="button" aria-label="关闭" @click="publishDialogVisible = false" v-if="!isStamping">×</button>
          </div>
        </template>

        <div class="paper-content">
          <div class="center-row">
            <input v-model="publishForm.title" class="title-input" placeholder="在此输入榜文标题" />
          </div>
          <div class="center-row">
            <textarea v-model="publishForm.description" class="desc-input" rows="4" placeholder="在此详细描述任务内容、目标及特殊要求…"></textarea>
          </div>
          <div class="ink-divider"></div>

          <div class="meta-grid">
            <div class="meta-item">
              <label>悬赏金额</label>
              <div class="ink-field reward-field">
                <input type="number" v-model="publishForm.reward" />
                <span class="unit">灵石</span>
              </div>
            </div>

            <div class="meta-item">
              <label>任务类型</label>
              <el-select v-model="publishForm.missionType" placeholder="请选择" class="ink-select">
                <el-option label="降妖" :value="1" />
                <el-option label="采集" :value="2" />
                <el-option label="护送" :value="3" />
                <el-option label="其他" :value="4" />
              </el-select>
            </div>

            <div class="meta-item">
              <label>截止日期</label>
              <el-date-picker
                  v-model="publishForm.deadline"
                  type="datetime"
                  placeholder="无期限"
                  format="YYYY/MM/DD"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  class="ink-date-picker"
              />
            </div>

            <div class="meta-item">
              <label>最低境界</label>
              <el-select v-model="publishForm.minRealm" placeholder="炼气期" class="ink-select">
                <el-option v-for="r in realmOptions" :key="r.value" :label="r.label" :value="r.value" />
              </el-select>
            </div>

            <div class="meta-item full-width">
              <label>难度等级</label>
              <div class="seal-selector">
                <span
                    v-for="i in 4"
                    :key="i"
                    :class="['seal-opt', { active: publishForm.difficulty === i }]"
                    @click="publishForm.difficulty = i"
                >{{ difficultyText(i) }}</span>
              </div>
            </div>
          </div>

          <p v-if="publishError" class="lwg-inline-error">{{ publishError }}</p>

          <div class="stamp-layer" v-if="isStamping">
            <div class="stamp-mark"><div class="stamp-inner">悬赏<br>发布</div></div>
          </div>
        </div>

        <template #footer>
          <div class="paper-footer" v-if="!isStamping">
            <button class="ink-btn cancel" type="button" @click="publishDialogVisible = false">撤销</button>
            <button class="ink-btn submit" type="button" @click="handlePublishTrigger">张 贴 榜 文</button>
          </div>
          <div class="paper-footer-stamping" v-else>
            <span>正在盖印…</span>
          </div>
        </template>
      </el-dialog>

      <!-- ================= 悬赏令详情 ================= -->
      <el-dialog v-model="detailDialogVisible" width="800px" class="detail-dialog" align-center>
        <template #header>
          <div class="paper-header paper-header--plain">
            <div class="paper-title paper-title--sm">悬 赏 令 详 情</div>
          </div>
        </template>

        <div v-if="currentMission" class="detail-content">
          <div class="detail-header">
            <h3 class="detail-title">
              <span class="id-tag lwg-mono">#{{ currentMission.id }}</span>
              {{ currentMission.title }}
              <span v-if="currentMission.publisherId === myUserId" class="owner-badge">我发布的</span>
            </h3>
            <span :class="['lwg-status', `lwg-status--${currentMission.status}`]">
              {{ getStatusText(currentMission.status) }}
            </span>
          </div>

          <el-descriptions border :column="3" size="default" class="info-grid">
            <el-descriptions-item label="任务类型">{{ typeText(currentMission.missionType) }}</el-descriptions-item>
            <el-descriptions-item label="难度等级">
              <span :class="['diff-tag', `diff-${currentMission.difficulty}`]">{{ difficultyText(currentMission.difficulty) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最低境界">{{ realmText(currentMission.minRealm) || '不限' }}</el-descriptions-item>
            <el-descriptions-item label="赏金">
              <span class="lwg-num reward">{{ currentMission.reward }} 灵石</span>
            </el-descriptions-item>
            <el-descriptions-item label="发布者ID">
              <span class="lwg-mono">{{ currentMission.publisherId }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="接单者ID">
              <span class="lwg-mono">{{ currentMission.acceptorId || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="截止时间">{{ formatDate(currentMission.deadline) || '无期限' }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-box">
            <div class="section-title">任务进度流转</div>
            <el-steps :active="currentMission.status + 1" align-center class="ink-steps">
              <el-step title="榜文发布" :description="formatDate(currentMission.createTime)" />
              <el-step title="道友接榜" :description="formatDate(currentMission.acceptTime) || '等待接榜…'" />
              <el-step title="提交复命" :description="formatDate(currentMission.submitTime) || '修炼中…'" />
              <el-step title="验收完成" :description="formatDate(currentMission.finishTime) || '待结算'" />
            </el-steps>
          </div>

          <div class="section-box">
            <div class="section-title">任务详情描述</div>
            <div class="section-content">{{ currentMission.description || '（未填写）' }}</div>
          </div>

          <div class="section-box" v-if="currentMission.proofData">
            <div class="section-title">交付凭证</div>
            <div class="section-content">{{ currentMission.proofData }}</div>
          </div>

          <div class="section-box section-box--danger" v-if="currentMission.cancelReason">
            <div class="section-title">取消原因</div>
            <div class="section-content">{{ currentMission.cancelReason }}</div>
          </div>

          <p v-if="feedback[currentMission.id]" class="lwg-inline-error is-fading">
            {{ feedback[currentMission.id] }}
          </p>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <button class="lwg-btn lwg-btn--outline" type="button" @click="detailDialogVisible = false">关闭卷轴</button>
            <button
                v-if="currentMission && canAccept(currentMission)"
                class="lwg-btn lwg-btn--primary"
                type="button"
                :disabled="acceptingId === currentMission.id"
                @click="handleAcceptInDetail"
            >
              {{ acceptingId === currentMission.id ? '接榜中…' : '接榜' }}
            </button>
            <button
                v-if="currentMission && canCancel(currentMission)"
                class="lwg-btn lwg-btn--danger"
                type="button"
                @click="handleCancelInDetail"
            >
              撤榜退回押金
            </button>
          </div>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getMissionList, acceptMission, publishMission, cancelMission } from '../api/mission'
import { errText } from '../utils/request'

const router = useRouter()
const myUserId = Number(localStorage.getItem('lwg_user_id'))

/* ---------------- 字典（与后端枚举对齐） ---------------- */
// 与 MissionStatusEnum 一致：1 → 进行中、2 → 待验收
// （原为「修仙中 / 待结算」，与同页页签文案自相矛盾）
const getStatusText = (val) => ({ 0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消' }[val] ?? '--')
const difficultyText = (val) => ({ 1: '简单', 2: '普通', 3: '困难', 4: '地狱' }[val] || '未知')
const typeText = (val) => ({ 1: '降妖', 2: '采集', 3: '护送', 4: '其他' }[val] || '未知')
const REALMS = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期']
const realmText = (val) => REALMS[val - 1] || ''
const realmOptions = REALMS.map((label, i) => ({ label, value: i + 1 }))

const statusTabs = [
  { value: 0, label: '招募中' },
  { value: 1, label: '进行中' },
  { value: 2, label: '待验收' },
  { value: 3, label: '已归档' },
  { value: 4, label: '已取消' }
]

/* ---------------- 数据 ---------------- */
const loading = ref(false)
const tableData = ref([])
const acceptingId = ref(null)
const feedback = reactive({})     // missionId -> 就地提示文案（可预期失败不弹 toast）
const changedIds = ref(new Set()) // 已原位变更状态、但未重新拉取的任务
const page = ref(1)
const pageSize = ref(12)

const publishDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isStamping = ref(false)
const publishError = ref('')
const currentMission = ref(null)

const queryParams = reactive({ status: 0, keyword: '', missionType: null, difficulty: null })

const blankForm = () => ({
  publisherId: myUserId,
  title: '',
  description: '',
  reward: 10,
  difficulty: 1,
  minRealm: 1,
  missionType: 1,
  deadline: null
})
const publishForm = ref(blankForm())

/* ---------------- 断点：< 960px 表格切卡片流 ---------------- */
const isNarrow = ref(false)
let mql = null
const syncNarrow = (e) => {
  isNarrow.value = e.matches
  pageSize.value = e.matches ? 8 : 12
  page.value = 1
}

/* ---------------- 工具 ---------------- */
const formatDate = (s) => (s ? String(s).replace('T', ' ').substring(0, 19) : '')
const brief = (text, max = 22) => {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '…' : text
}
const canAccept = (row) => queryParams.status === 0 && row.publisherId !== myUserId && row.status === 0
const canCancel = (row) => queryParams.status === 0 && row.publisherId === myUserId && row.status === 0
const rowClass = ({ row }) => (changedIds.value.has(row.id) ? 'row-changed' : '')

// 就地提示：2s 后自动消失（可预期失败不打断操作）
let feedbackTimers = {}
const showFeedback = (missionId, text) => {
  feedback[missionId] = text
  clearTimeout(feedbackTimers[missionId])
  feedbackTimers[missionId] = setTimeout(() => { delete feedback[missionId] }, 2000)
}

/* ---------------- 分页（前端先做） ---------------- */
const total = computed(() => tableData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return tableData.value.slice(start, start + pageSize.value)
})
watch(total, () => {
  const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

/* ---------------- 加载 ---------------- */
const loadData = async () => {
  loading.value = true
  try {
    tableData.value = (await getMissionList(queryParams)) || []
    changedIds.value = new Set() // 重新拉取后重置原位变更标记
  } catch {
    tableData.value = [] // 系统级异常已由 request 拦截器 toast
  } finally {
    loading.value = false
  }
}

const handleSwitchTab = (status) => {
  if (queryParams.status === status) return
  queryParams.status = status
  page.value = 1
  Object.keys(feedback).forEach((k) => delete feedback[k])
  loadData()
}

/* ---------------- 接榜（原位变更状态，不整页刷新） ---------------- */
const handleAccept = async (mission) => {
  acceptingId.value = mission.id
  try {
    await acceptMission(
        { missionId: mission.id, acceptorId: myUserId },
        { inlineError: true } // 抢单失败是可预期结果，就地红字而非 toast
    )
    // 原位变更：卡片状态转「进行中」，不重新拉取整个列表
    const hit = tableData.value.find((m) => m.id === mission.id)
    if (hit) {
      hit.status = 1
      hit.acceptorId = myUserId
    }
    changedIds.value = new Set(changedIds.value).add(mission.id)
    ElMessage.success('接榜成功，请按约完成悬赏')
  } catch (e) {
    showFeedback(mission.id, errText(e, '接榜失败，可能已被其他道友抢先'))
  } finally {
    acceptingId.value = null
  }
}

const handleAcceptInDetail = () => {
  if (currentMission.value) handleAccept(currentMission.value)
}

/* ---------------- 撤榜 ---------------- */
// 仅发布者本人、且任务处于「待接单」时可执行，与后端 MissionServiceImpl.cancelMission 的校验一致
const handleCancel = async (mission) => {
  let reason
  try {
    const { value } = await ElMessageBox.prompt('撤榜后押金将解冻退回你的可用灵石，请填写撤榜原因：', '确认撤榜', {
      confirmButtonText: '确认撤榜',
      cancelButtonText: '再想想',
      inputPlaceholder: '例如：已有道友私下接取',
      inputValidator: (v) => {
        if (!v || !v.trim()) return '请填写撤榜原因'
        if (v.length > 255) return '撤榜原因最多 255 个字符'
        return true
      }
    })
    reason = value
  } catch {
    return // 用户点了「再想想」
  }

  try {
    await cancelMission(
        { missionId: mission.id, userId: myUserId, cancelReason: reason.trim() },
        { inlineError: true }
    )
    const hit = tableData.value.find((m) => m.id === mission.id)
    if (hit) {
      hit.status = 4
      hit.cancelReason = reason.trim()
    }
    changedIds.value = new Set(changedIds.value).add(mission.id)
    ElMessage.success('撤榜成功，押金已退回可用灵石')
  } catch (e) {
    showFeedback(mission.id, errText(e, '撤榜失败'))
  }
}

const handleCancelInDetail = () => {
  if (currentMission.value) handleCancel(currentMission.value)
}

/* ---------------- 发布悬赏 ---------------- */
const openPublishDialog = () => {
  publishForm.value = blankForm()
  publishError.value = ''
  isStamping.value = false
  publishDialogVisible.value = true
}

const openDetailDialog = (row) => {
  currentMission.value = row
  detailDialogVisible.value = true
}

const handlePublishTrigger = () => {
  if (!publishForm.value.title.trim()) {
    publishError.value = '榜文不可无标题'
    return
  }
  if (!(Number(publishForm.value.reward) > 0)) {
    publishError.value = '悬赏金额需大于 0'
    return
  }
  publishError.value = ''
  isStamping.value = true
  setTimeout(submitPublish, 1200) // 盖章动画
}

const submitPublish = async () => {
  try {
    await publishMission(publishForm.value)
    isStamping.value = false
    publishDialogVisible.value = false
    ElMessage.success('榜文张贴成功')
    if (queryParams.status !== 0) handleSwitchTab(0)
    else loadData()
  } catch (e) {
    isStamping.value = false
    publishError.value = errText(e, '张贴失败，请稍后再试')
  }
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  if (!localStorage.getItem('lwg_user_id')) {
    router.push('/login')
    return
  }
  mql = window.matchMedia('(max-width: 960px)')
  syncNarrow(mql)
  mql.addEventListener('change', syncNarrow)
  loadData()
})

onUnmounted(() => {
  mql?.removeEventListener('change', syncNarrow)
  Object.values(feedbackTimers).forEach(clearTimeout)
  feedbackTimers = {}
})
</script>

<style scoped>
.page {
  max-width: var(--lwg-shell-max);
  margin: 0 auto;
  padding: var(--lwg-sp-6) var(--lwg-sp-5) var(--lwg-sp-7);
}

.head-actions { display: flex; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; }

/* ---------- 未同步提示 ---------- */
.sync-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lwg-sp-3);
  flex-wrap: wrap;
  margin-bottom: var(--lwg-sp-4);
  padding: 10px var(--lwg-sp-4);
  border: 1px dashed var(--lwg-line-strong);
  border-radius: var(--lwg-radius);
  color: var(--lwg-ink-2);
  font-size: var(--lwg-fs-sm);
}
.sync-bar__btn {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--lwg-cinnabar);
  font-size: var(--lwg-fs-sm);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

/* ---------- 表格 ---------- */
.hall-table { width: 100%; }
.title-cell { display: flex; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; }
.mission-title { color: var(--lwg-ink); font-weight: 500; }
.owner-badge {
  flex: none;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-cinnabar);
  border: 1px solid var(--lwg-cinnabar);
  border-radius: var(--lwg-radius);
  padding: 0 5px;
  line-height: 17px;
  font-weight: 400;
}
.brief { font-size: var(--lwg-fs-sm); }
.reward { color: var(--lwg-cinnabar); font-size: var(--lwg-fs-md); }
.unit { font-size: var(--lwg-fs-xs); }
.time { font-size: var(--lwg-fs-sm); }
.op-group { display: flex; justify-content: center; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; }

:deep(.row-changed) { background: var(--lwg-cinnabar-wash) !important; }
:deep(.row-changed td) { background: transparent !important; }

/* ---------- 卡片流（窄屏） ---------- */
.card-flow { display: flex; flex-direction: column; gap: var(--lwg-sp-3); }
.mission-card { padding: var(--lwg-sp-4); }
.mission-card.is-changed { border-left: 3px solid var(--lwg-cinnabar); }
.mission-card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--lwg-sp-2); }
.mission-card__title {
  display: flex;
  align-items: center;
  gap: var(--lwg-sp-2);
  flex-wrap: wrap;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  color: var(--lwg-ink);
  margin: var(--lwg-sp-2) 0 6px;
  letter-spacing: 1px;
}
.mission-card__desc {
  margin: 0 0 var(--lwg-sp-3);
  font-size: var(--lwg-fs-sm);
  color: var(--lwg-ink-3);
  line-height: 1.7;
}
.mission-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--lwg-sp-2) var(--lwg-sp-4);
  margin: 0 0 var(--lwg-sp-3);
  padding: var(--lwg-sp-3) 0;
  border-top: 1px dashed var(--lwg-line);
  border-bottom: 1px dashed var(--lwg-line);
}
.mission-card__meta > div { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.mission-card__meta dt { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); flex: none; }
.mission-card__meta dd {
  margin: 0;
  font-size: var(--lwg-fs-sm);
  color: var(--lwg-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mission-card__ops { display: flex; gap: var(--lwg-sp-2); flex-wrap: wrap; }

.pager { display: flex; justify-content: flex-end; margin-top: var(--lwg-sp-5); }

/* =========================================
   悬赏令 / 复命书弹窗（宣纸）
   ========================================= */
:deep(.paper-dialog) {
  background-color: var(--lwg-paper-3);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  box-shadow: var(--lwg-shadow-float);
  animation: unrollScroll .5s cubic-bezier(.2, .8, .2, 1) forwards;
}
@keyframes unrollScroll {
  0% { clip-path: inset(0 0 100% 0); }
  100% { clip-path: inset(-20% -20% -20% -20%); }
}
:deep(.paper-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.paper-dialog .el-dialog__body) { padding: 0 var(--lwg-sp-6) 10px; position: relative; }
:deep(.paper-dialog .el-dialog__footer) { padding: 10px var(--lwg-sp-6) var(--lwg-sp-5); background: transparent; }

.paper-header { position: relative; text-align: center; padding: var(--lwg-sp-5) 0 var(--lwg-sp-4); }
.paper-header--plain { padding: var(--lwg-sp-5) 0 var(--lwg-sp-3); border-bottom: 1px dashed var(--lwg-line); }
.paper-title {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-xl);
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--lwg-ink);
}
.paper-title--sm { font-size: var(--lwg-fs-lg); }
.close-icon {
  position: absolute;
  top: var(--lwg-sp-3);
  right: var(--lwg-sp-4);
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: var(--lwg-ink-3);
  cursor: pointer;
}
.close-icon:hover { color: var(--lwg-cinnabar); }

.center-row { display: flex; justify-content: center; margin-bottom: var(--lwg-sp-4); }
.title-input {
  width: 80%;
  text-align: center;
  border: none;
  border-bottom: 2px solid var(--lwg-line-strong);
  background: transparent;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  font-weight: 700;
  color: var(--lwg-ink);
  padding: 10px;
  outline: none;
}
.title-input:focus { border-bottom-color: var(--lwg-cinnabar); }
.title-input::placeholder { color: var(--lwg-ink-3); font-weight: 400; }
.desc-input {
  width: 90%;
  text-align: center;
  border: none;
  background: transparent;
  font-size: var(--lwg-fs-base);
  color: var(--lwg-ink-2);
  line-height: 1.8;
  outline: none;
  resize: none;
}
.desc-input::placeholder { color: var(--lwg-ink-3); }
.ink-divider {
  height: 1px;
  width: 90%;
  margin: 10px auto var(--lwg-sp-4);
  background: repeating-linear-gradient(to right, var(--lwg-line) 0 5px, transparent 5px 10px);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--lwg-sp-5) var(--lwg-sp-6);
  width: 100%;
  padding: 10px var(--lwg-sp-5) 0;
  box-sizing: border-box;
}
.meta-item { display: flex; flex-direction: column; align-items: flex-start; gap: var(--lwg-sp-2); min-width: 0; }
.meta-item.full-width { grid-column: 1 / -1; align-items: center; margin-top: 10px; }
.meta-item label { font-size: var(--lwg-fs-sm); color: var(--lwg-ink-2); font-weight: 700; letter-spacing: 1px; }

.reward-field { display: flex; align-items: baseline; width: 100%; border-bottom: 1px solid var(--lwg-line); padding-bottom: var(--lwg-sp-1); }
.reward-field input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-family: var(--lwg-font-mono);
  font-weight: 700;
  font-size: var(--lwg-fs-md);
  color: var(--lwg-cinnabar);
  outline: none;
}
.unit { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); margin-left: var(--lwg-sp-2); }

:deep(.ink-select), :deep(.ink-date-picker) { width: 100%; }
:deep(.ink-select .el-input__wrapper), :deep(.ink-date-picker .el-input__wrapper) {
  box-shadow: none !important;
  border: none;
  border-bottom: 1px solid var(--lwg-line);
  border-radius: 0;
  padding: 0 0 var(--lwg-sp-1);
  background: transparent;
  width: 100%;
}
:deep(.ink-select .el-input__wrapper.is-focus), :deep(.ink-date-picker .el-input__wrapper.is-focus) {
  border-bottom-color: var(--lwg-cinnabar);
}
:deep(.ink-select .el-input__inner), :deep(.ink-date-picker .el-input__inner) {
  text-align: left;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-base);
  font-weight: 700;
  color: var(--lwg-ink);
}

.seal-selector { display: flex; gap: var(--lwg-sp-2); flex-wrap: wrap; justify-content: center; }
.seal-opt {
  font-size: var(--lwg-fs-sm);
  padding: 3px 8px;
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  color: var(--lwg-ink-3);
  cursor: pointer;
  white-space: nowrap;
  transition: color .18s ease, border-color .18s ease, background-color .18s ease;
}
.seal-opt:hover { border-color: var(--lwg-cinnabar); color: var(--lwg-cinnabar); }
.seal-opt.active {
  border-color: var(--lwg-cinnabar);
  color: var(--lwg-cinnabar);
  font-weight: 700;
  background: var(--lwg-cinnabar-wash);
}

.paper-footer { display: flex; justify-content: center; gap: var(--lwg-sp-5); margin-top: 10px; }
.paper-footer-stamping { text-align: center; color: var(--lwg-ink-3); font-size: var(--lwg-fs-sm); letter-spacing: 2px; }
.ink-btn {
  border: none;
  cursor: pointer;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  letter-spacing: 4px;
  padding: 8px var(--lwg-sp-5);
  border-radius: var(--lwg-radius);
  transition: background-color .25s ease, color .25s ease;
}
.ink-btn.cancel { background: transparent; color: var(--lwg-ink-2); }
.ink-btn.cancel:hover { color: var(--lwg-cinnabar); }
.ink-btn.submit { background: var(--lwg-cinnabar); color: var(--lwg-on-accent); }
.ink-btn.submit:hover { background: var(--lwg-cinnabar-hover); }

/* 印章动画 */
.stamp-layer {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 10;
  background: rgba(251, 248, 241, .5);
}
.stamp-mark {
  width: 130px;
  height: 130px;
  border: 4px solid var(--lwg-cinnabar);
  border-radius: 50%;
  color: var(--lwg-cinnabar);
  display: flex;
  justify-content: center;
  align-items: center;
  transform: scale(3);
  opacity: 0;
  animation: stamp-in .4s cubic-bezier(.175, .885, .32, 1.275) forwards;
}
.stamp-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 94px;
  height: 94px;
  padding: var(--lwg-sp-3);
  border: 2px dashed var(--lwg-cinnabar);
  border-radius: 50%;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-xl);
  font-weight: 900;
  writing-mode: vertical-rl;
  letter-spacing: 8px;
}
@keyframes stamp-in {
  0% { transform: scale(3) rotate(-10deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1) rotate(-5deg); opacity: .9; }
}

/* ---------- 详情弹窗 ---------- */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--lwg-sp-3);
  flex-wrap: wrap;
  margin-bottom: var(--lwg-sp-4);
  padding-bottom: var(--lwg-sp-3);
  border-bottom: 1px solid var(--lwg-line);
}
.detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  color: var(--lwg-ink);
  margin: 0;
}
.id-tag {
  background: var(--lwg-paper-2);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  padding: 1px 8px;
  font-size: var(--lwg-fs-sm);
  color: var(--lwg-ink-3);
}
.diff-tag { font-size: var(--lwg-fs-xs); padding: 1px 8px; border: 1px solid currentColor; border-radius: var(--lwg-radius); }
.diff-1 { color: var(--lwg-success); }
.diff-2 { color: var(--lwg-gold); }
.diff-3, .diff-4 { color: var(--lwg-danger); }

:deep(.info-grid .el-descriptions__label) { width: 100px; color: var(--lwg-ink-3); font-weight: 400; }
:deep(.info-grid .el-descriptions__cell) { font-size: var(--lwg-fs-sm); }

.section-box {
  margin-top: var(--lwg-sp-4);
  padding: var(--lwg-sp-4);
  background: var(--lwg-paper);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
}
.section-box--danger { border-color: var(--lwg-danger); background: var(--lwg-cinnabar-wash); }
.section-title {
  font-size: var(--lwg-fs-sm);
  font-weight: 700;
  color: var(--lwg-ink);
  padding-bottom: 6px;
  margin-bottom: 10px;
  border-bottom: 1px dashed var(--lwg-line);
  letter-spacing: 1px;
}
.section-box--danger .section-title { color: var(--lwg-danger); border-bottom-color: var(--lwg-danger); }
.section-content { font-size: var(--lwg-fs-base); color: var(--lwg-ink-2); line-height: 1.8; white-space: pre-wrap; }

/* 水墨步骤条：跟随朱砂 token，不再用 Element 默认蓝 */
:deep(.ink-steps .el-step__head.is-wait),
:deep(.ink-steps .el-step__head.is-process) { color: var(--lwg-ink-3); border-color: var(--lwg-line); }
:deep(.ink-steps .el-step__title.is-wait),
:deep(.ink-steps .el-step__title.is-process) { color: var(--lwg-ink-3); font-weight: 400; }
:deep(.ink-steps .el-step__description.is-wait),
:deep(.ink-steps .el-step__description.is-process) { color: var(--lwg-line-strong); }
:deep(.ink-steps .el-step__head.is-success),
:deep(.ink-steps .el-step__head.is-finish) { color: var(--lwg-cinnabar); border-color: var(--lwg-cinnabar); }
:deep(.ink-steps .el-step__title.is-success),
:deep(.ink-steps .el-step__title.is-finish) { color: var(--lwg-cinnabar); font-weight: 700; }
:deep(.ink-steps .el-step__description.is-success),
:deep(.ink-steps .el-step__description.is-finish) { color: var(--lwg-ink-3); }
:deep(.ink-steps .el-step__line) { background-color: var(--lwg-line); }
:deep(.ink-steps .el-step__line-inner) { border-color: var(--lwg-cinnabar) !important; }

.dialog-footer { display: flex; justify-content: flex-end; gap: var(--lwg-sp-2); flex-wrap: wrap; }

/* ---------- 响应式 ---------- */
@media (max-width: 960px) {
  .page { padding: var(--lwg-sp-5) var(--lwg-sp-4) var(--lwg-sp-6); }
  .meta-grid { grid-template-columns: minmax(0, 1fr); gap: var(--lwg-sp-4); padding: 10px 0 0; }
}
@media (max-width: 640px) {
  .page { padding: var(--lwg-sp-4) var(--lwg-sp-3) var(--lwg-sp-6); }
  .lwg-page-head { align-items: flex-start; }
  .head-actions { width: 100%; }
  .head-actions .lwg-btn { flex: 1; }
  .mission-card__meta { grid-template-columns: minmax(0, 1fr); }
  .pager { justify-content: center; }
  .paper-title { font-size: var(--lwg-fs-lg); letter-spacing: 3px; }
  :deep(.paper-dialog .el-dialog__body) { padding: 0 var(--lwg-sp-4) 10px; }
  :deep(.paper-dialog .el-dialog__footer) { padding: 10px var(--lwg-sp-4) var(--lwg-sp-4); }
  :deep(.paper-dialog) { --el-dialog-width: 94% !important; }
  :deep(.detail-dialog) { --el-dialog-width: 94% !important; }
  .title-input { width: 100%; font-size: var(--lwg-fs-md); }
  .desc-input { width: 100%; text-align: left; }
  .dialog-footer .lwg-btn { flex: 1; }
}
</style>
