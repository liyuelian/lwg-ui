<template>
  <AppLayout subtitle="个人中心 · 灵脉账务">
    <div class="page">
      <!-- ================= 身份与资产 ================= -->
      <section class="id-card lwg-card">
        <div class="id-card__left">
          <div class="rep-ring" @click="openReputationDialog" title="点击查看功德簿">
            <el-progress
                type="circle"
                :percentage="calculateRepPercentage(userInfo.reputation)"
                :color="getReputationColor(userInfo.reputation)"
                :width="84"
                :stroke-width="4"
                :show-text="false"
                class="rep-circle"
            />
            <span class="rep-ring__seal">灵</span>
          </div>

          <div class="id-card__info">
            <div class="id-card__name">
              <span class="username">{{ userInfo.username || '无名道友' }}</span>
              <button class="uid-chip lwg-mono" type="button" title="点击复制 UID" @click="copyUid">
                UID: {{ myUserId }}
              </button>
            </div>
            <div class="id-card__tags">
              <span class="realm-badge">{{ getRealmText(userInfo.realm) }}</span>
              <el-tooltip :content="userInfo.status === 1 ? '账号状态正常' : '账号异常或被封印'" placement="top">
                <span class="status-chip">
                  <span :class="['status-dot', userInfo.status === 1 ? 'active' : 'sealed']"></span>
                  <span>{{ userInfo.status === 1 ? '道心通明' : '封印中' }}</span>
                </span>
              </el-tooltip>
              <span class="since">入宗 {{ formatDateSimple(userInfo.createTime) }}</span>
            </div>
          </div>
        </div>

        <div class="id-card__mid">
          <div class="data-item">
            <span class="data-label">可用灵石</span>
            <span class="lwg-num data-value data-value--money">{{ userInfo.balance || 0 }}</span>
          </div>
          <span class="vr" aria-hidden="true"></span>
          <div class="data-item">
            <span class="data-label">
              冻结押金
              <el-tooltip content="任务保证金，完结后扣除或退回" placement="top">
                <i class="help-mark">?</i>
              </el-tooltip>
            </span>
            <span class="lwg-num data-value data-value--frozen">{{ userInfo.frozenBalance || 0 }}</span>
          </div>
        </div>

        <div class="id-card__right">
          <button class="ink-recharge" type="button" @click="openRechargeDialog">
            <span class="ink-recharge__seal">纳</span>
            <span class="ink-recharge__text">灵脉灌注</span>
          </button>
          <router-link to="/rank" class="lwg-btn lwg-btn--outline">查看天道碑</router-link>
        </div>
      </section>

      <!-- ================= 业务与账务 ================= -->
      <section class="content lwg-card">
        <div class="lwg-tabs">
          <div
              class="lwg-tab"
              :class="{ 'is-active': activeTab === 'published' }"
              @click="activeTab = 'published'"
          >我发布的</div>
          <div
              class="lwg-tab"
              :class="{ 'is-active': activeTab === 'accepted' }"
              @click="activeTab = 'accepted'"
          >我接取的</div>
          <div
              class="lwg-tab"
              :class="{ 'is-active': activeTab === 'transactions' }"
              @click="activeTab = 'transactions'"
          >灵脉账务</div>
        </div>

        <!-- ---------- 我发布的 ---------- -->
        <div v-if="activeTab === 'published'" class="pane">
          <el-table v-if="!isNarrow" :data="publishedList" class="tbl">
            <el-table-column prop="title" label="榜文标题" min-width="200">
              <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
            </el-table-column>
            <el-table-column label="悬赏" width="120" align="right">
              <template #default="{ row }"><span class="lwg-num reward">{{ row.reward }}</span></template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="170" align="center">
              <template #default="{ row }"><span class="lwg-mono lwg-muted time">{{ formatDate(row.createTime) }}</span></template>
            </el-table-column>
            <el-table-column label="批复" width="170" align="center">
              <template #default="{ row }">
                <div v-if="row.status === 2" class="audit-group">
                  <button class="lwg-btn lwg-btn--outline lwg-btn--sm is-pass" type="button" @click="handleAudit(row, true)">通过</button>
                  <button class="lwg-btn lwg-btn--outline lwg-btn--sm is-reject" type="button" @click="handleAudit(row, false)">驳回</button>
                </div>
                <span v-else class="lwg-dash">--</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-else class="card-flow">
            <article v-for="row in publishedList" :key="row.id" class="mini-card lwg-card">
              <div class="mini-card__head">
                <span class="mission-title">{{ row.title }}</span>
                <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
              </div>
              <div class="mini-card__meta">
                <span>悬赏 <b class="lwg-num reward">{{ row.reward }}</b></span>
                <span class="lwg-mono">{{ formatDate(row.createTime) }}</span>
              </div>
              <div v-if="row.status === 2" class="mini-card__ops">
                <button class="lwg-btn lwg-btn--outline lwg-btn--sm is-pass" type="button" @click="handleAudit(row, true)">通过</button>
                <button class="lwg-btn lwg-btn--outline lwg-btn--sm is-reject" type="button" @click="handleAudit(row, false)">驳回</button>
              </div>
            </article>
            <div v-if="!publishedList.length" class="lwg-empty">尚无发布的悬赏</div>
          </div>
        </div>

        <!-- ---------- 我接取的 ---------- -->
        <div v-if="activeTab === 'accepted'" class="pane">
          <el-table v-if="!isNarrow" :data="acceptedList" class="tbl">
            <el-table-column prop="title" label="榜文标题" min-width="200">
              <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
            </el-table-column>
            <el-table-column label="悬赏" width="120" align="right">
              <template #default="{ row }"><span class="lwg-num reward">{{ row.reward }}</span></template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <button v-if="row.status === 1" class="lwg-btn lwg-btn--primary lwg-btn--sm" type="button" @click="openSubmitDialog(row)">提交复命</button>
                <span v-else class="lwg-dash">--</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-else class="card-flow">
            <article v-for="row in acceptedList" :key="row.id" class="mini-card lwg-card">
              <div class="mini-card__head">
                <span class="mission-title">{{ row.title }}</span>
                <span :class="['lwg-status', `lwg-status--${row.status}`]">{{ getStatusText(row.status) }}</span>
              </div>
              <div class="mini-card__meta">
                <span>悬赏 <b class="lwg-num reward">{{ row.reward }}</b></span>
              </div>
              <div v-if="row.status === 1" class="mini-card__ops">
                <button class="lwg-btn lwg-btn--primary lwg-btn--sm" type="button" @click="openSubmitDialog(row)">提交复命</button>
              </div>
            </article>
            <div v-if="!acceptedList.length" class="lwg-empty">尚无接取的悬赏</div>
          </div>
        </div>

        <!-- ---------- 灵脉账务 ---------- -->
        <div v-show="activeTab === 'transactions'" class="pane finance">
          <div class="summary">
            <div class="summary__item lwg-card">
              <span class="summary__label">累计净收入</span>
              <span class="lwg-num summary__num is-income">+{{ overview.totalIncome }}</span>
              <span class="summary__sub">本月 +{{ overview.monthIncome }}</span>
            </div>
            <div class="summary__item lwg-card">
              <span class="summary__label">累计净支出</span>
              <span class="lwg-num summary__num is-expense">-{{ overview.totalExpense }}</span>
              <span class="summary__sub">本月 -{{ overview.monthExpense }}</span>
            </div>
            <div class="summary__item lwg-card">
              <span class="summary__label">当前冻结</span>
              <span class="lwg-num summary__num is-frozen">{{ userInfo.frozenBalance || 0 }}</span>
              <span class="summary__sub">悬赏押金，未消耗</span>
            </div>
          </div>

          <!-- 冻结中明细（与下方"内部流转流水"是两个不同概念） -->
          <FrozenFundCard
              class="lwg-card"
              :user-id="myUserId"
              :user-frozen="userInfo.frozenBalance || 0"
              :dev-mode="devMode"
          />

          <div class="chart-row">
            <div class="chart-box lwg-card">
              <div class="chart-box__title">近 12 个月资金动向</div>
              <div ref="barChartRef" class="echarts-box"></div>
            </div>
            <div class="chart-box lwg-card">
              <div class="chart-box__title">收支构成分析</div>
              <div ref="pieChartRef" class="echarts-box"></div>
            </div>
          </div>

          <div class="ledger">
            <div class="ledger__head">
              <div>
                <div class="ledger__title">交易流水明细</div>
                <div class="ledger__hint">含收入、支出与内部流转（发布与退回）两侧流水</div>
              </div>
              <div class="ledger__filters">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    size="small"
                    value-format="YYYY-MM-DD"
                    class="ledger__date"
                    @change="handleSearch"
                />
                <el-radio-group v-model="queryParams.category" size="small" @change="handleSearch">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="income">收入</el-radio-button>
                  <el-radio-button label="expense">支出</el-radio-button>
                  <!-- 原为「冻结/退款」，实为发布与退回的流水，非当前冻结余额 -->
                  <el-radio-button label="locked">内部流转</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <el-table :data="transactionList" class="tbl" height="400" v-loading="loading">
              <el-table-column label="交易时间" width="170">
                <template #default="{ row }"><span class="lwg-mono lwg-muted time">{{ formatDate(row.createTime) }}</span></template>
              </el-table-column>
              <el-table-column label="业务类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getBizTypeTag(row.type)" effect="plain" size="small">{{ getTransactionTypeText(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变动金额" width="130" align="right">
                <template #default="{ row }">
                  <span :class="['lwg-num', amountClass(row)]">{{ row.amount > 0 ? '+' : '' }}{{ row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="影响账户" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.assetType === 1 ? 'success' : 'primary'" effect="light" size="small">
                    {{ row.assetType === 1 ? '可用' : '冻结' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变动后余额" width="130" align="right">
                <template #default="{ row }">
                  <span class="lwg-num lwg-muted">{{ row.balanceAfter ?? '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || row.description }}</template>
              </el-table-column>
            </el-table>

            <div v-if="total > 0" class="ledger__pager">
              <el-pagination
                  v-model:current-page="queryParams.page"
                  v-model:page-size="queryParams.pageSize"
                  :total="total"
                  :page-sizes="[10, 20, 50]"
                  :layout="isNarrow ? 'prev, pager, next' : 'total, sizes, prev, pager, next'"
                  background
                  @size-change="loadTransactions"
                  @current-change="loadTransactions"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================= 功德簿 ================= -->
    <el-dialog v-model="reputationDialogVisible" title="功德簿" width="520px" align-center class="rep-dialog">
      <div v-loading="repLoading">
        <div class="rep-score">
          <span class="lwg-num" :style="{ color: getReputationColor(userInfo.reputation) }">
            {{ ((userInfo.reputation || 0) / 100).toFixed(2) }}
          </span>
          <span class="rep-score__label">信誉值</span>
        </div>

        <div class="rep-list">
          <el-timeline v-if="reputationLogs.length">
            <el-timeline-item
                v-for="(log, index) in reputationLogs"
                :key="index"
                :type="log.changeScore > 0 ? 'success' : 'danger'"
                :timestamp="formatDate(log.createTime)"
                placement="top"
            >
              <div class="rep-item">
                <div class="rep-item__remark">{{ log.remark }}</div>
                <div class="rep-item__delta" :class="log.changeScore > 0 ? 'is-up' : 'is-down'">
                  {{ log.changeScore > 0 ? '+' : '' }}{{ (log.changeScore / 100).toFixed(2) }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="lwg-empty">暂无记录</div>
        </div>
      </div>
    </el-dialog>

    <!-- ================= 提交复命 ================= -->
    <el-dialog v-model="submitDialogVisible" width="500px" class="paper-dialog" :show-close="false" align-center>
      <template #header>
        <div class="paper-header">
          <div class="paper-title">提 交 复 命 书</div>
          <button class="close-icon" type="button" aria-label="关闭" @click="submitDialogVisible = false">×</button>
        </div>
      </template>
      <div class="paper-content">
        <el-form :model="submitForm" label-position="top">
          <el-form-item label="任务编号">
            <div class="ink-field is-disabled lwg-mono">#{{ submitForm.missionId }}</div>
          </el-form-item>
          <el-form-item label="复命详情">
            <div class="ink-textarea-wrap">
              <textarea v-model="submitForm.desc" class="ink-textarea" rows="4" placeholder="请详细描述任务完成情况…"></textarea>
            </div>
          </el-form-item>
          <el-form-item label="留影石链接（凭证图片）">
            <div class="ink-field"><input v-model="submitForm.image" placeholder="http://…" /></div>
          </el-form-item>
          <el-form-item label="提交材料（逗号分隔）">
            <div class="ink-field"><input v-model="submitForm.materialsRaw" placeholder="例如：妖丹, 狐皮" /></div>
          </el-form-item>
        </el-form>
        <p v-if="submitError" class="lwg-inline-error">{{ submitError }}</p>
      </div>
      <template #footer>
        <div class="paper-footer">
          <button class="ink-btn cancel" type="button" @click="submitDialogVisible = false">暂存</button>
          <button class="ink-btn submit" type="button" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '呈递中…' : '确认交付' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ================= 灵脉灌注 ================= -->
    <el-dialog v-model="rechargeDialogVisible" width="460px" class="paper-dialog" :show-close="false" align-center>
      <template #header>
        <div class="paper-header">
          <div class="paper-title">灵 脉 灌 注</div>
          <button class="close-icon" type="button" aria-label="关闭" @click="rechargeDialogVisible = false">×</button>
        </div>
      </template>
      <div class="paper-content">
        <div class="recharge-grid">
          <button
              v-for="amount in [6, 30, 98, 198, 328, 648]"
              :key="amount"
              type="button"
              :class="['recharge-item', { active: rechargeForm.amount === amount }]"
              @click="rechargeForm.amount = amount"
          >
            <span class="recharge-item__amount lwg-num">{{ amount }}</span>
            <span class="recharge-item__unit">灵石</span>
            <span class="recharge-item__price">¥ {{ amount }}</span>
          </button>
        </div>
        <div class="ink-field reward-field">
          <span class="prefix">自定义</span>
          <input type="number" v-model="rechargeForm.amount" placeholder="输入数量" />
          <span class="unit">灵石</span>
        </div>
        <p v-if="rechargeError" class="lwg-inline-error">{{ rechargeError }}</p>
      </div>
      <template #footer>
        <div class="paper-footer">
          <button class="ink-btn cancel" type="button" @click="rechargeDialogVisible = false">放弃</button>
          <button class="ink-btn submit" type="button" :disabled="recharging" @click="handleRecharge">
            {{ recharging ? '灌注中…' : '立即灌注' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </AppLayout>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import AppLayout from '../components/AppLayout.vue'
import FrozenFundCard from '../components/FrozenFundCard.vue'
import {
  getUserInfo, rechargeBalance,
  getFinanceOverview, getTransactionList, getFinanceCharts,
  getUserReputationLogs
} from '../api/user'
import { getMyMissions, submitMission, auditMission } from '../api/mission'
import { errText } from '../utils/request'
import { cssVar, token } from '../utils/theme'

const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])

/* ---------------- 财务 ---------------- */
const transactionList = ref([])
const total = ref(0)
const loading = ref(false)
const dateRange = ref([])
const overview = ref({ totalIncome: 0, totalExpense: 0, monthIncome: 0, monthExpense: 0 })
const queryParams = ref({ userId: myUserId, page: 1, pageSize: 10, category: 'all', startDate: null, endDate: null })

/* 开发者模式下额外显示对账断言面板（/admin/reconcile） */
const devMode = /(?:\?|&)dev=1/.test(window.location.search)

/* ---------------- 信誉 ---------------- */
const reputationDialogVisible = ref(false)
const repLoading = ref(false)
const reputationLogs = ref([])

/* ---------------- 图表 ---------------- */
const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChart = null
let pieChart = null
let chartObserver = null

/* ---------------- 弹窗 ---------------- */
const submitDialogVisible = ref(false)
const submitForm = ref({ missionId: null, desc: '', image: '', materialsRaw: '' })
const submitError = ref('')
const submitting = ref(false)
const rechargeDialogVisible = ref(false)
const rechargeForm = ref({ amount: 6 })
const rechargeError = ref('')
const recharging = ref(false)

/* ---------------- 断点 ---------------- */
const isNarrow = ref(false)
let mql = null
const syncNarrow = (e) => { isNarrow.value = e.matches }

/* ---------------- 辅助 ---------------- */
const formatDate = (s) => (s ? String(s).replace('T', ' ').substring(0, 19) : '')
const formatDateSimple = (s) => (s ? String(s).split('T')[0] : '未知')
// 与 MissionStatusEnum 对齐
const getStatusText = (v) => ({ 0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消' }[v] ?? '--')
const REALMS = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期']
const getRealmText = (v) => REALMS[v - 1] || '境界未明'

const calculateRepPercentage = (score) => {
  if (!score && score !== 0) return 60
  const p = (score / 100) / 120 * 100
  return p > 100 ? 100 : p
}

/**
 * ECharts 只吃具体的颜色字符串，不认 var(--token)，所以必须在运行时把
 * token 读出来；兜底字面量集中在 src/utils/theme.js，视图内不出现色值。
 */
const getReputationColor = (score) => {
  const s = (score || 6000) / 100
  // 高信誉取金线色，寻常取成功色，业障取危险色 —— 全部来自 token
  if (s >= 80) return token('--lwg-gold')
  if (s >= 60) return token('--lwg-success')
  return token('--lwg-danger')
}

const getTransactionTypeText = (type) =>
    ({ 1: '发布悬赏', 2: '结算支出', 3: '任务收益', 4: '悬赏退回', 5: '灵石充值' }[type] || '其他')
const getBizTypeTag = (type) => {
  if ([5, 3].includes(type)) return 'success'
  if ([2].includes(type)) return 'danger'
  if ([1, 4].includes(type)) return 'warning'
  return 'info'
}
const amountClass = (row) => {
  if (row.type === 1) return 'is-neutral'
  return row.amount > 0 ? 'lwg-amount-out' : 'lwg-amount-in'
}

/* ---------------- 加载 ---------------- */
const loadUserInfo = async () => {
  if (myUserId) userInfo.value = (await getUserInfo(myUserId)) || {}
}
const loadPublished = async () => {
  try {
    publishedList.value = (await getMyMissions({ userId: myUserId, type: 1 })) || []
  } catch { publishedList.value = [] }
}
const loadAccepted = async () => {
  try {
    acceptedList.value = (await getMyMissions({ userId: myUserId, type: 2 })) || []
  } catch { acceptedList.value = [] }
}

const loadOverview = async () => {
  try {
    const res = await getFinanceOverview(myUserId)
    if (res) overview.value = res.data || res
  } catch { /* 拦截器已提示 */ }
}

const loadTransactions = async () => {
  loading.value = true
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startDate = dateRange.value[0]
    queryParams.value.endDate = dateRange.value[1]
  } else {
    queryParams.value.startDate = null
    queryParams.value.endDate = null
  }
  try {
    const res = await getTransactionList(queryParams.value)
    const data = res?.data || res || {}
    transactionList.value = data.list || []
    total.value = data.total || 0
  } catch {
    transactionList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryParams.value.page = 1; loadTransactions() }

/* ---------------- 图表（配色全部来自 token） ---------------- */
const renderCharts = async () => {
  let data
  try {
    data = (await getFinanceCharts(myUserId)) || {}
  } catch {
    return
  }
  data = data.data || data

  const ink = token('--lwg-ink-2')
  const ink3 = token('--lwg-ink-3')
  const line = token('--lwg-line')
  const income = token('--lwg-success')
  const expense = token('--lwg-danger')
  const cinnabar = token('--lwg-cinnabar')
  const gold = token('--lwg-gold')
  const paper = token('--lwg-paper-3')

  const axisCommon = {
    axisLine: { lineStyle: { color: line } },
    axisLabel: { color: ink3, fontSize: 12 },
    splitLine: { lineStyle: { color: line, type: 'dashed' } }
  }

  if (barChartRef.value) {
    if (barChart) barChart.dispose()
    barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      textStyle: { fontFamily: cssVar('--lwg-font-body') },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: ink } },
      grid: { top: '12%', bottom: '18%', left: '3%', right: '5%', containLabel: true },
      xAxis: { type: 'category', data: data.trendMonths || [], ...axisCommon, splitLine: { show: false } },
      yAxis: { type: 'value', ...axisCommon },
      series: [
        { name: '收入', type: 'line', smooth: true, data: data.trendIncome || [], itemStyle: { color: income }, areaStyle: { opacity: .1 } },
        { name: '支出', type: 'line', smooth: true, data: data.trendExpense || [], itemStyle: { color: expense }, areaStyle: { opacity: .1 } }
      ]
    })
  }

  if (pieChartRef.value) {
    if (pieChart) pieChart.dispose()
    pieChart = echarts.init(pieChartRef.value)
    const palette = [income, expense, cinnabar, gold, ink3]
    pieChart.setOption({
      textStyle: { fontFamily: cssVar('--lwg-font-body') },
      color: palette,
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: ink } },
      series: [{
        name: '收支构成',
        type: 'pie',
        radius: ['42%', '66%'],
        itemStyle: { borderRadius: 2, borderColor: paper, borderWidth: 2 },
        data: data.pieData || [],
        label: { show: false }
      }]
    })
  }
}

const resizeCharts = () => {
  barChart?.resize()
  pieChart?.resize()
}

const disposeCharts = () => {
  chartObserver?.disconnect()
  chartObserver = null
  barChart?.dispose()
  pieChart?.dispose()
  barChart = null
  pieChart = null
}

watch(activeTab, (val) => {
  if (val === 'published') loadPublished()
  if (val === 'accepted') loadAccepted()
  if (val === 'transactions') {
    loadOverview()
    loadTransactions()
    nextTick(() => renderCharts())
  }
}, { immediate: true })

/* ---------------- 动作 ---------------- */
const openReputationDialog = async () => {
  reputationDialogVisible.value = true
  if (reputationLogs.value.length === 0) {
    repLoading.value = true
    try {
      const res = await getUserReputationLogs({ page: 1, size: 20, userId: myUserId })
      reputationLogs.value = res?.data?.list || res?.list || []
    } catch {
      reputationLogs.value = []
    } finally {
      repLoading.value = false
    }
  }
}

const openSubmitDialog = (row) => {
  submitForm.value = { missionId: row.id, desc: '', image: '', materialsRaw: '' }
  submitError.value = ''
  submitDialogVisible.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  submitError.value = ''
  try {
    await submitMission({
      missionId: submitForm.value.missionId,
      userId: myUserId,
      proofData: JSON.stringify({
        desc: submitForm.value.desc,
        image: submitForm.value.image,
        materials: submitForm.value.materialsRaw
      })
    })
    submitDialogVisible.value = false
    ElMessage.success('已呈递')
    loadAccepted()
  } catch (e) {
    submitError.value = errText(e, '呈递失败')
  } finally {
    submitting.value = false
  }
}

const handleAudit = (row, isPass) => {
  ElMessageBox.prompt(isPass ? '确认验收？' : '确认驳回？', '批复', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    try {
      await auditMission({ missionId: row.id, userId: myUserId, pass: isPass, remark: value })
      ElMessage.success('批复已下达')
      loadPublished()
      loadUserInfo()
    } catch { /* 拦截器已提示 */ }
  }).catch(() => {})
}

const openRechargeDialog = () => {
  rechargeForm.value.amount = 6
  rechargeError.value = ''
  rechargeDialogVisible.value = true
}

const handleRecharge = async () => {
  const amount = Number(rechargeForm.value.amount)
  if (!amount || amount <= 0) {
    rechargeError.value = '请选择或输入正确的灵石数量'
    return
  }
  recharging.value = true
  rechargeError.value = ''
  try {
    await rechargeBalance({ userId: myUserId, amount })
    rechargeDialogVisible.value = false
    ElMessage.success(`成功灌注 ${amount} 灵石`)
    loadUserInfo()
    if (activeTab.value === 'transactions') {
      loadOverview()
      loadTransactions()
      renderCharts()
    }
  } catch (e) {
    rechargeError.value = errText(e, '灌注失败')
  } finally {
    recharging.value = false
  }
}

const copyUid = async () => {
  if (!myUserId) return
  try {
    await navigator.clipboard.writeText(String(myUserId))
    ElMessage.success('UID 已复制')
  } catch {
    ElMessage.error('复制失败，请手动框选复制')
  }
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  mql = window.matchMedia('(max-width: 960px)')
  syncNarrow(mql)
  mql.addEventListener('change', syncNarrow)
  loadUserInfo()
})

// 原实现在模块作用域直接 addEventListener('resize', …) 且从不解绑：
// 路由切走后监听仍在，闭包持有已废弃的 chart 实例。
// 改为 ResizeObserver + 统一的 onUnmounted 清理。
onUnmounted(() => {
  mql?.removeEventListener('change', syncNarrow)
  disposeCharts()
})

watch([barChartRef, pieChartRef], ([barEl, pieEl]) => {
  if (!barEl && !pieEl) return
  chartObserver?.disconnect()
  chartObserver = new ResizeObserver(() => resizeCharts())
  if (barEl) chartObserver.observe(barEl)
  if (pieEl) chartObserver.observe(pieEl)
})
</script>

<style scoped>
.page {
  max-width: var(--lwg-shell-max);
  margin: 0 auto;
  padding: var(--lwg-sp-6) var(--lwg-sp-5) var(--lwg-sp-7);
  display: flex;
  flex-direction: column;
  gap: var(--lwg-sp-4);
}

/* ================= 身份与资产 ================= */
.id-card {
  display: flex;
  align-items: center;
  gap: var(--lwg-sp-5);
  padding: var(--lwg-sp-5);
  flex-wrap: wrap;
}
.id-card__left { display: flex; align-items: center; gap: var(--lwg-sp-4); flex: 1 1 320px; min-width: 0; }

.rep-ring {
  position: relative;
  flex: none;
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.rep-ring__seal {
  position: absolute;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: var(--lwg-cinnabar-wash);
  border: 1px solid var(--lwg-line);
  font-family: var(--lwg-font-display);
  font-size: 26px;
  color: var(--lwg-cinnabar);
  transition: transform .3s ease;
}
.rep-ring:hover .rep-ring__seal { transform: rotate(-6deg) scale(1.04); }
.rep-ring :deep(.el-progress-circle__track) { stroke: var(--lwg-line); }

.id-card__info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.id-card__name { display: flex; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; }
.username {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--lwg-ink);
}
.uid-chip {
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  background: var(--lwg-paper-2);
  color: var(--lwg-ink-3);
  font-size: var(--lwg-fs-xs);
  padding: 2px 8px;
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease;
}
.uid-chip:hover { color: var(--lwg-cinnabar); border-color: var(--lwg-cinnabar); }
.uid-chip:active { transform: scale(.97); }

.id-card__tags { display: flex; align-items: center; gap: var(--lwg-sp-2); flex-wrap: wrap; }
.realm-badge {
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-gold);
  border: 1px solid var(--lwg-gold);
  border-radius: var(--lwg-radius);
  padding: 1px 8px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-2);
  padding: 1px 8px;
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  cursor: help;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-dot.active { background: var(--lwg-success); animation: dot-pulse 2s infinite; }
.status-dot.sealed { background: var(--lwg-danger); }
@keyframes dot-pulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 124, 89, .4); }
  70% { box-shadow: 0 0 0 4px rgba(74, 124, 89, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 124, 89, 0); }
}
.since { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

.id-card__mid {
  display: flex;
  align-items: center;
  gap: var(--lwg-sp-5);
  flex: 1 1 260px;
  justify-content: center;
}
.vr { width: 1px; height: 44px; background: var(--lwg-line); }
.data-item { display: flex; flex-direction: column; gap: 4px; }
.data-label { display: flex; align-items: center; gap: 5px; font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.help-mark {
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--lwg-line-strong);
  color: var(--lwg-ink-3);
  font-size: 10px;
  font-style: normal;
  cursor: help;
}
.data-value { font-size: var(--lwg-fs-lg); }
.data-value--money { color: var(--lwg-cinnabar); }
.data-value--frozen { color: var(--lwg-gold); }

.id-card__right { display: flex; align-items: center; gap: var(--lwg-sp-3); flex-wrap: wrap; }
.ink-recharge {
  display: inline-flex;
  align-items: center;
  gap: var(--lwg-sp-2);
  padding: 8px 18px;
  background: var(--lwg-paper-3);
  border: 1px solid var(--lwg-cinnabar);
  border-radius: var(--lwg-radius);
  cursor: pointer;
  transition: background-color .25s ease;
}
.ink-recharge__seal {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  background: var(--lwg-cinnabar);
  color: var(--lwg-on-accent);
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-xs);
  border-radius: var(--lwg-radius);
  transform: rotate(-5deg);
  transition: transform .25s ease;
}
.ink-recharge__text {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-base);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--lwg-cinnabar);
}
.ink-recharge:hover { background: var(--lwg-cinnabar-wash); }
.ink-recharge:hover .ink-recharge__seal { transform: rotate(0) scale(1.08); }

/* ================= 内容 ================= */
.content { padding: var(--lwg-sp-5); }
.pane { min-height: 200px; }
.tbl { width: 100%; }
.mission-title { color: var(--lwg-ink); font-weight: 500; }
.reward { color: var(--lwg-cinnabar); }
.time { font-size: var(--lwg-fs-sm); }
.audit-group { display: flex; gap: var(--lwg-sp-2); justify-content: center; }
.is-pass { border-color: var(--lwg-success); color: var(--lwg-success); }
.is-pass:hover { background: var(--lwg-success); color: var(--lwg-on-accent); }
.is-reject { border-color: var(--lwg-danger); color: var(--lwg-danger); }
.is-reject:hover { background: var(--lwg-danger); color: var(--lwg-on-accent); }

.card-flow { display: flex; flex-direction: column; gap: var(--lwg-sp-3); }
.mini-card { padding: var(--lwg-sp-3) var(--lwg-sp-4); }
.mini-card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--lwg-sp-2); }
.mini-card__meta {
  display: flex;
  gap: var(--lwg-sp-3);
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-3);
}
.mini-card__ops { display: flex; gap: var(--lwg-sp-2); margin-top: var(--lwg-sp-3); }

/* ================= 账务 ================= */
.finance { display: flex; flex-direction: column; gap: var(--lwg-sp-4); }
.summary { display: flex; gap: var(--lwg-sp-3); flex-wrap: wrap; }
.summary__item {
  flex: 1 1 200px;
  padding: var(--lwg-sp-4);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary__label { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.summary__num { font-size: var(--lwg-fs-lg); }
.is-income { color: var(--lwg-success); }
.is-expense { color: var(--lwg-danger); }
.is-frozen { color: var(--lwg-gold); }
.summary__sub { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

.chart-row { display: flex; gap: var(--lwg-sp-4); flex-wrap: wrap; }
.chart-box { flex: 1 1 360px; padding: var(--lwg-sp-4); height: 320px; display: flex; flex-direction: column; }
.chart-box__title {
  font-size: var(--lwg-fs-sm);
  font-weight: 700;
  color: var(--lwg-ink);
  padding-left: 10px;
  border-left: 3px solid var(--lwg-cinnabar);
  margin-bottom: var(--lwg-sp-2);
  letter-spacing: 1px;
}
.echarts-box { flex: 1; width: 100%; min-height: 0; }

.ledger { display: flex; flex-direction: column; gap: var(--lwg-sp-3); }
.ledger__head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--lwg-sp-3); flex-wrap: wrap; }
.ledger__title { font-size: var(--lwg-fs-md); font-weight: 700; color: var(--lwg-ink); letter-spacing: 1px; }
.ledger__hint { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); margin-top: 3px; }
.ledger__filters { display: flex; gap: var(--lwg-sp-2); flex-wrap: wrap; }
.ledger__date { width: 240px; }
.ledger__pager { display: flex; justify-content: flex-end; }
.is-neutral { color: var(--lwg-gold); }

/* ================= 弹窗 ================= */
.rep-score { display: flex; align-items: baseline; justify-content: center; gap: var(--lwg-sp-2); margin-bottom: var(--lwg-sp-4); }
.rep-score .lwg-num { font-size: var(--lwg-fs-2xl); }
.rep-score__label { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.rep-list { max-height: 380px; overflow-y: auto; padding: 0 var(--lwg-sp-2); }
.rep-item {
  padding: 10px var(--lwg-sp-3);
  background: var(--lwg-paper);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--lwg-sp-3);
}
.rep-item__remark { font-size: var(--lwg-fs-sm); color: var(--lwg-ink); }
.rep-item__delta { font-family: var(--lwg-font-mono); font-weight: 700; font-size: var(--lwg-fs-sm); flex: none; }
.rep-item__delta.is-up { color: var(--lwg-success); }
.rep-item__delta.is-down { color: var(--lwg-danger); }

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
:deep(.paper-dialog .el-dialog__body) { padding: 0 var(--lwg-sp-6) 10px; }
:deep(.paper-dialog .el-dialog__footer) { padding: 10px var(--lwg-sp-6) var(--lwg-sp-5); background: transparent; }

.paper-header { position: relative; text-align: center; padding: var(--lwg-sp-5) 0 var(--lwg-sp-4); }
.paper-title {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-lg);
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--lwg-ink);
}
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

.ink-field {
  border-bottom: 1px solid var(--lwg-line);
  padding: 8px 0;
  transition: border-color .2s ease;
}
.ink-field input { width: 100%; border: none; background: transparent; outline: none; font-size: var(--lwg-fs-base); color: var(--lwg-ink); }
.ink-field:focus-within { border-bottom-color: var(--lwg-cinnabar); }
.ink-field.is-disabled { color: var(--lwg-ink-3); border-bottom-style: dashed; }
.ink-textarea-wrap {
  width: 100%;
  background: var(--lwg-paper);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  padding: 10px;
}
.ink-textarea-wrap:focus-within { border-color: var(--lwg-cinnabar); }
.ink-textarea { width: 100%; border: none; background: transparent; outline: none; resize: none; font-size: var(--lwg-fs-base); line-height: 1.7; color: var(--lwg-ink); }

.paper-footer { display: flex; justify-content: flex-end; gap: var(--lwg-sp-3); }
.ink-btn {
  border: none;
  cursor: pointer;
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-md);
  letter-spacing: 3px;
  padding: 8px var(--lwg-sp-5);
  border-radius: var(--lwg-radius);
  transition: background-color .25s ease, color .25s ease;
}
.ink-btn.cancel { background: transparent; color: var(--lwg-ink-2); }
.ink-btn.cancel:hover { color: var(--lwg-cinnabar); }
.ink-btn.submit { background: var(--lwg-cinnabar); color: var(--lwg-on-accent); }
.ink-btn.submit:hover:not(:disabled) { background: var(--lwg-cinnabar-hover); }
.ink-btn:disabled { opacity: .55; cursor: not-allowed; }

.recharge-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--lwg-sp-3); margin-bottom: var(--lwg-sp-4); }
.recharge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--lwg-sp-3) 0;
  background: var(--lwg-paper);
  border: 1px solid var(--lwg-line);
  border-radius: var(--lwg-radius);
  cursor: pointer;
  transition: border-color .18s ease, background-color .18s ease;
}
.recharge-item:hover { border-color: var(--lwg-cinnabar); }
.recharge-item.active { border-color: var(--lwg-cinnabar); background: var(--lwg-cinnabar-wash); }
.recharge-item__amount { font-size: var(--lwg-fs-md); color: var(--lwg-ink); }
.recharge-item.active .recharge-item__amount { color: var(--lwg-cinnabar); }
.recharge-item__unit { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }
.recharge-item__price { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); }

.reward-field { display: flex; align-items: center; gap: var(--lwg-sp-2); background: var(--lwg-paper); padding: 10px var(--lwg-sp-3); border: 1px solid var(--lwg-line); border-radius: var(--lwg-radius); }
.reward-field .prefix { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); flex: none; }
.reward-field input { flex: 1; min-width: 0; text-align: center; font-family: var(--lwg-font-mono); }
.reward-field .unit { font-size: var(--lwg-fs-xs); color: var(--lwg-ink-3); flex: none; }

/* ================= 响应式 ================= */
@media (max-width: 960px) {
  .page { padding: var(--lwg-sp-5) var(--lwg-sp-4) var(--lwg-sp-6); }
  .content { padding: var(--lwg-sp-4); }
  .id-card { gap: var(--lwg-sp-4); }
  .id-card__mid { justify-content: flex-start; }
  .chart-row { flex-direction: column; }
  .chart-box { flex: 1 1 auto; }
}
@media (max-width: 640px) {
  .page { padding: var(--lwg-sp-4) var(--lwg-sp-3) var(--lwg-sp-6); }
  .id-card { padding: var(--lwg-sp-4); }
  .id-card__left { flex-direction: column; align-items: flex-start; }
  .id-card__mid { gap: var(--lwg-sp-4); }
  .id-card__right { width: 100%; }
  .id-card__right > * { flex: 1; justify-content: center; text-align: center; }
  .summary__item { flex: 1 1 100%; }
  .ledger__filters { width: 100%; }
  .ledger__date { width: 100%; }
  .ledger__pager { justify-content: center; }
  .chart-box { height: 260px; }
  :deep(.paper-dialog), :deep(.rep-dialog) { --el-dialog-width: 92% !important; }
  :deep(.paper-dialog .el-dialog__body) { padding: 0 var(--lwg-sp-4) 10px; }
  :deep(.paper-dialog .el-dialog__footer) { padding: 10px var(--lwg-sp-4) var(--lwg-sp-4); }
  .recharge-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .paper-footer { justify-content: stretch; }
  .paper-footer .ink-btn { flex: 1; }
}
</style>
