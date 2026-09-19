<template>
  <div class="dashboard-container">

    <div class="user-card">
      <div class="left-panel">

        <div class="avatar-container" @click="openReputationDialog" title="点击查看功德簿">
          <div class="magic-ring-wrapper">
            <el-progress
                type="circle"
                :percentage="calculateRepPercentage(userInfo.reputation)"
                :color="getReputationColor(userInfo.reputation)"
                :width="86"
                :stroke-width="4"
                :show-text="false"
                class="rep-circle"
            />
          </div>
          <div class="avatar-inner">
            <el-avatar :size="70" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"/>
          </div>
        </div>

        <div class="info-container">
          <div class="name-box">
            <span class="username">{{ userInfo.username || '无名道友' }}</span>
            <span class="uid-tag" @click="copyUid" title="点击复制 UID">UID: {{ myUserId }}</span>
          </div>

          <div class="tags-box">
            <span class="realm-badge">{{ getRealmText(userInfo.realm) }}</span>

            <el-tooltip :content="userInfo.status === 1 ? '账号状态正常' : '账号异常或被封印'" placement="top">
              <div class="status-badge-new">
                <span :class="['status-dot', userInfo.status === 1 ? 'active' : 'sealed']"></span>
                <span class="status-text">{{ userInfo.status === 1 ? '道心通明' : '封印中' }}</span>
              </div>
            </el-tooltip>
          </div>

          <div class="time-box">
            <span>📅 入宗: {{ formatDateSimple(userInfo.createTime) }}</span>
          </div>
        </div>
      </div>

      <div class="vertical-divider"></div>

      <div class="middle-panel">
        <div class="data-item">
          <span class="data-label">可用灵石 (Balance)</span>
          <span class="data-value money">{{ userInfo.balance || 0 }} 💎</span>
        </div>
        <div class="data-item">
            <span class="data-label">
              冻结押金 (Frozen)
              <el-tooltip content="任务保证金，完结后扣除或退回" placement="top"><i class="help-circle">?</i></el-tooltip>
            </span>
          <span class="data-value frozen">{{ userInfo.frozenBalance || 0 }} ❄️</span>
        </div>
      </div>

      <div class="right-panel">
        <div class="recharge-btn-ink" @click="openRechargeDialog">
          <span class="ink-seal">纳</span>
          <span class="ink-text">灵脉灌注</span>
        </div>
        <button class="primary-btn" @click="$router.push('/mission-hall')">前往大厅</button>
      </div>
    </div>

    <div class="content-card">

      <div class="tabs-bar">
        <div class="tab-item" :class="{ active: activeTab === 'published' }" @click="activeTab = 'published'">
          <span>📜 我发布的</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'accepted' }" @click="activeTab = 'accepted'">
          <span>⚔️ 我接取的</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'transactions' }" @click="activeTab = 'transactions'">
          <span>📈 财务对账</span>
        </div>
      </div>

      <div v-if="activeTab === 'published'" class="tab-content">
        <el-table :data="publishedList" class="elegant-table" :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column prop="title" label="榜文标题" min-width="200">
            <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }"><span class="reward-text">{{ row.reward }} 💎</span></template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }"><span :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span></template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" width="160" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="批复" width="180" align="center">
            <template #default="{ row }">
              <div v-if="row.status === 2" class="audit-group">
                <button class="small-outline-btn pass" @click="handleAudit(row, true)">通过</button>
                <button class="small-outline-btn reject" @click="handleAudit(row, false)">驳回</button>
              </div>
              <span v-else class="disabled-text">--</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="activeTab === 'accepted'" class="tab-content">
        <el-table :data="acceptedList" class="elegant-table" :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column prop="title" label="榜文标题" min-width="200">
            <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }"><span class="reward-text">{{ row.reward }} 💎</span></template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }"><span :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <button v-if="row.status === 1" class="primary-btn small" @click="openSubmitDialog(row)">提交复命</button>
              <span v-else class="disabled-text">无需操作</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-show="activeTab === 'transactions'" class="tab-content finance-dashboard">

        <div class="finance-summary">
          <div class="summary-card income">
            <div class="card-icon">📈</div>
            <div class="card-info">
              <div class="card-title">累计净收入 (Total Income)</div>
              <div class="card-num money">+{{ overview.totalIncome }}</div>
              <div class="card-sub">本月新增: +{{ overview.monthIncome }}</div>
            </div>
          </div>
          <div class="summary-card expense">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-title">累计净支出 (Total Expense)</div>
              <div class="card-num expense-num">-{{ overview.totalExpense }}</div>
              <div class="card-sub">本月支出: -{{ overview.monthExpense }}</div>
            </div>
          </div>
          <div class="summary-card balance">
            <div class="card-icon">❄️</div>
            <div class="card-info">
              <div class="card-title">当前冻结 (Locked)</div>
              <div class="card-num frozen">{{ userInfo.frozenBalance || 0 }}</div>
              <div class="card-sub">悬赏押金，未消耗</div>
            </div>
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-container left">
            <div class="chart-title">📊 近12个月资金动向</div>
            <div ref="barChartRef" class="echarts-box"></div>
          </div>
          <div class="chart-container right">
            <div class="chart-title">☯️ 收支构成分析</div>
            <div ref="pieChartRef" class="echarts-box"></div>
          </div>
        </div>

        <div class="table-section">
          <div class="section-header">
            <span>📜 交易流水明细</span>
            <div class="filter-group" style="display: flex; gap: 10px;">
              <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  value-format="YYYY-MM-DD"
                  style="width: 240px;"
                  @change="handleSearch"
              />
              <el-radio-group v-model="queryParams.category" size="small" @change="handleSearch">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="income">只看收入</el-radio-button>
                <el-radio-button label="expense">只看支出</el-radio-button>
                <el-radio-button label="locked">冻结/退款</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <el-table
              :data="transactionList"
              class="elegant-table"
              height="400"
              v-loading="loading"
              :header-cell-style="{ background: '#f8f9fa', color: '#666' }"
          >
            <el-table-column prop="createTime" label="交易时间" width="170">
              <template #default="{ row }"><span class="mono-font">{{ formatDate(row.createTime) }}</span></template>
            </el-table-column>
            <el-table-column prop="type" label="业务类型" width="120" align="center">
              <template #default="{ row }"><el-tag :type="getBizTypeTag(row.type)" effect="plain" size="small">{{ getTransactionTypeText(row.type) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="amount" label="变动金额" width="130" align="right">
              <template #default="{ row }">
                  <span class="money-font" :style="{ color: getAmountColor(row), fontSize: '15px' }">
                    {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="assetType" label="影响账户" width="110" align="center">
              <template #default="{ row }"><el-tag :type="row.assetType === 1 ? 'success' : 'primary'" effect="light" size="small" round>{{ row.assetType === 1 ? '可用' : '冻结' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="balanceAfter" label="变动后余额" width="130" align="right">
              <template #default="{ row }"><span class="balance-snapshot">{{ row.balanceAfter !== undefined ? row.balanceAfter : '--' }}</span></template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || row.description }}</template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
            <el-pagination
                v-model:current-page="queryParams.page"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadTransactions"
                @current-change="loadTransactions"
            />
          </div>
        </div>

      </div>

    </div>

    <el-dialog v-model="reputationDialogVisible" title="📜 功德簿 (信誉明细)" width="500px" align-center class="custom-dialog">
      <div class="reputation-dialog-body" v-loading="repLoading">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 :style="{ color: getReputationColor(userInfo.reputation), fontSize: '36px', margin: '0 0 10px 0' }">
            {{ (userInfo.reputation / 100).toFixed(2) }}
          </h1>
        </div>
        <el-divider style="margin: 15px 0;"/>
        <div style="max-height: 400px; overflow-y: auto; padding: 0 10px;">
          <el-timeline>
            <el-timeline-item v-for="(log, index) in reputationLogs" :key="index" :type="log.changeScore > 0 ? 'success' : 'danger'" :timestamp="formatDate(log.createTime)" placement="top">
              <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #eee;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #333;">{{ log.remark }}</div>
                <div style="font-size: 12px; color: #666;">
                  变动: <span :style="{ color: log.changeScore > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">{{ log.changeScore > 0 ? '+' : '' }}{{ (log.changeScore / 100).toFixed(2) }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-if="reputationLogs.length === 0" style="text-align: center; color: #999; padding: 20px;">暂无记录</div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="submitDialogVisible" width="500px" class="custom-dialog paper-dialog" :show-close="false" align-center>
      <template #header>
        <div class="paper-header">
          <div class="paper-title">提 交 复 命 书</div>
          <button class="close-icon" @click="submitDialogVisible = false">×</button>
        </div>
      </template>
      <div class="paper-content">
        <el-form :model="submitForm" label-position="top">
          <el-form-item label="任务编号">
            <div class="ink-field disabled">#{{ submitForm.missionId }}</div>
          </el-form-item>
          <el-form-item label="复命详情">
            <div class="ink-textarea-wrapper"><textarea v-model="submitForm.desc" class="ink-textarea" rows="4" placeholder="请详细描述任务完成情况..."></textarea></div>
          </el-form-item>
          <el-form-item label="留影石链接 (凭证图片)">
            <div class="ink-field"><input v-model="submitForm.image" placeholder="http://..."/></div>
          </el-form-item>
          <el-form-item label="提交材料 (逗号分隔)">
            <div class="ink-field"><input v-model="submitForm.materialsRaw" placeholder="例如：妖丹, 狐皮"/></div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="paper-footer">
          <button class="ink-btn cancel" @click="submitDialogVisible = false">暂存</button>
          <button class="ink-btn submit" @click="handleSubmit">确认交付</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="rechargeDialogVisible" width="450px" class="custom-dialog paper-dialog" :show-close="false" align-center>
      <template #header>
        <div class="paper-header">
          <div class="paper-title">灵 脉 灌 注</div>
          <button class="close-icon" @click="rechargeDialogVisible = false">×</button>
        </div>
      </template>
      <div class="paper-content recharge-content">
        <div class="recharge-grid">
          <div v-for="amount in [6, 30, 98, 198, 328, 648]" :key="amount"
               :class="['recharge-item', { active: rechargeForm.amount === amount }]"
               @click="rechargeForm.amount = amount">
            <div class="gem-icon">💎</div>
            <div class="gem-amount">{{ amount }} 灵石</div>
            <div class="rmb-price">¥ {{ amount }}</div>
          </div>
        </div>
        <div class="custom-amount-box">
          <div class="ink-field reward-field"><span class="prefix">自定义:</span><input type="number" v-model="rechargeForm.amount" placeholder="输入数量"/><span class="unit">灵石</span></div>
        </div>
      </div>
      <template #footer>
        <div class="paper-footer">
          <button class="ink-btn cancel" @click="rechargeDialogVisible = false">放弃</button>
          <button class="ink-btn submit" @click="handleRecharge">立即灌注</button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {ref, onMounted, watch, nextTick} from 'vue'
import {
  getUserInfo, getMyMissions, rechargeBalance,
  getFinanceOverview, getTransactionList, getFinanceCharts,
  getUserReputationLogs
} from '../api/user'
import {submitMission, auditMission} from '../api/mission'
import {ElMessage, ElMessageBox} from 'element-plus'
import * as echarts from 'echarts'

const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])

// 财务模块 State
const transactionList = ref([])
const total = ref(0)
const loading = ref(false)
const dateRange = ref([])
const overview = ref({ totalIncome: 0, totalExpense: 0, monthIncome: 0, monthExpense: 0 })
const queryParams = ref({ userId: myUserId, page: 1, pageSize: 10, category: 'all', startDate: null, endDate: null })

// 信誉弹窗专用变量
const reputationDialogVisible = ref(false)
const repLoading = ref(false)
const reputationLogs = ref([])

// 图表实例
const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChart = null
let pieChart = null

// 弹窗相关
const submitDialogVisible = ref(false)
const submitForm = ref({missionId: null, desc: '', image: '', materialsRaw: ''})
const rechargeDialogVisible = ref(false)
const rechargeForm = ref({amount: 6})

// --- 信誉计算辅助工具 ---
const calculateRepPercentage = (score) => {
  if (!score && score !== 0) return 60
  let p = (score / 100) / 120 * 100
  return p > 100 ? 100 : p
}

const getReputationColor = (score) => {
  const s = (score || 6000) / 100
  if (s >= 80) return '#f3bc2d' // 功德金
  if (s >= 60) return '#34cc28' // 绿色
  return '#dc3333'              // 业障红
}


// 打开信誉弹窗并加载数据
const openReputationDialog = async () => {
  reputationDialogVisible.value = true
  if (reputationLogs.value.length === 0) {
    repLoading.value = true
    try {
      const res = await getUserReputationLogs({page: 1, size: 20, userId: myUserId})
      reputationLogs.value = res.data?.list || res.list || []
    } catch (e) {
      console.error('获取信誉日志失败', e)
    } finally {
      repLoading.value = false
    }
  }
}

// --- 枚举和辅助函数 ---
const formatDate = (dateStr) => dateStr ? dateStr.replace('T', ' ').substring(0, 19) : ''
const formatDateSimple = (dateStr) => dateStr ? dateStr.split('T')[0] : '未知'
const getStatusText = (val) => ({0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消'}[val] || '--')
const getRealmText = (val) => ({
  1: '炼气期', 2: '筑基期', 3: '金丹期',
  4: '元婴期', 5: '化神期', 6: '炼虚期',
  7: '合体期', 8: '大乘期', 9: '渡劫期'
}[val] || '?未知境界?')
const getTransactionTypeText = (type) => {
  // 与后端 TransactionType 枚举保持一致: 1-发布悬赏(中性), 2-结算支出, 3-任务收益, 4-悬赏退回(中性), 5-灵石充值
  const map = {
    1: '发布悬赏', 2: '结算支出', 3: '任务收益',
    4: '悬赏退回', 5: '灵石充值'
  }
  return map[type] || '其他'
}
const getBizTypeTag = (type) => {
  if ([5, 3].includes(type)) return 'success'
  if ([2].includes(type)) return 'danger'
  if ([1, 4].includes(type)) return 'warning'
  return 'info'
}
const getAmountColor = (row) => {
  if (row.type === 1) return '#faad14'
  if (row.amount > 0) return '#52c41a'
  return '#cf1322'
}

// --- 核心逻辑区 ---
const loadUserInfo = async () => {
  if (myUserId) userInfo.value = await getUserInfo(myUserId) || {}
}
const loadPublished = async () => publishedList.value = await getMyMissions({userId: myUserId, type: 1}) || []
const loadAccepted = async () => acceptedList.value = await getMyMissions({userId: myUserId, type: 2}) || []

const loadOverview = async () => {
  const res = await getFinanceOverview(myUserId)
  if (res) {
    const data = res.data || res
    overview.value = data
  }
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
    const data = res.data || res
    transactionList.value = data.list
    total.value = data.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryParams.value.page = 1; loadTransactions() }

const renderCharts = async () => {
  const res = await getFinanceCharts(myUserId)
  const data = res.data || res

  if (barChartRef.value) {
    if (barChart) barChart.dispose()
    barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: {trigger: 'axis'},
      legend: {bottom: 0},
      grid: {top: '15%', bottom: '15%', left: '3%', right: '5%', containLabel: true},
      xAxis: {type: 'category', data: data.trendMonths},
      yAxis: {type: 'value'},
      series: [
        { name: '收入', type: 'line', smooth: true, data: data.trendIncome, itemStyle: {color: '#52c41a'}, areaStyle: {opacity: 0.1} },
        { name: '支出', type: 'line', smooth: true, data: data.trendExpense, itemStyle: {color: '#ff4d4f'}, areaStyle: {opacity: 0.1} }
      ]
    })
  }

  if (pieChartRef.value) {
    if (pieChart) pieChart.dispose()
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: {trigger: 'item'},
      legend: {bottom: 0, type: 'scroll'},
      series: [{
        name: '收支构成',
        type: 'pie',
        radius: ['40%', '65%'],
        itemStyle: {borderRadius: 5, borderColor: '#fff', borderWidth: 2},
        data: data.pieData,
        label: {show: false}
      }]
    })
  }
}

watch(activeTab, (val) => {
  if (val === 'published') loadPublished()
  if (val === 'accepted') loadAccepted()
  if (val === 'transactions') {
    loadOverview()
    loadTransactions()
    nextTick(() => renderCharts())
  }
}, {immediate: true})

window.addEventListener('resize', () => { barChart && barChart.resize(); pieChart && pieChart.resize() })

const openSubmitDialog = (row) => { submitForm.value = {missionId: row.id, desc: '', image: '', materialsRaw: ''}; submitDialogVisible.value = true }
const handleSubmit = async () => {
  try {
    await submitMission({
      missionId: submitForm.value.missionId,
      userId: myUserId,
      proofData: JSON.stringify({ desc: submitForm.value.desc, image: submitForm.value.image, materials: submitForm.value.materialsRaw })
    });
    ElMessage.success('已呈递！');
    submitDialogVisible.value = false;
    loadAccepted()
  } catch (e) {}
}
const handleAudit = (row, isPass) => {
  ElMessageBox.prompt(isPass ? '确认验收？' : '确认驳回？', '批复', {
    confirmButtonText: '确定', cancelButtonText: '取消'
  }).then(async ({value}) => {
    try {
      await auditMission({missionId: row.id, userId: myUserId, pass: isPass, remark: value});
      ElMessage.success('批复已下达');
      loadPublished();
      loadUserInfo()
    } catch (e) {}
  }).catch(() => {})
}
const openRechargeDialog = () => { rechargeForm.value.amount = 6; rechargeDialogVisible.value = true }
const handleRecharge = async () => {
  if (!rechargeForm.value.amount || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请选择或输入正确的灵石数量');
    return
  }
  try {
    await rechargeBalance({userId: myUserId, amount: Number(rechargeForm.value.amount)});
    ElMessage.success(`成功灌注 ${rechargeForm.value.amount} 灵石！`);
    rechargeDialogVisible.value = false;
    loadUserInfo();
    if (activeTab.value === 'transactions') { loadOverview(); loadTransactions(); renderCharts(); }
  } catch (error) {}
}

onMounted(() => { loadUserInfo() })

// 🔥 一键复制 UID 逻辑 🔥
const copyUid = async () => {
  if (!myUserId) return
  try {
    // 使用现代浏览器的剪贴板 API
    await navigator.clipboard.writeText(String(myUserId))
    ElMessage.success('UID 已复制，可传音给其他道友！')
  } catch (err) {
    ElMessage.error('复制失败，请手动框选复制')
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

.dashboard-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 30px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.user-card, .content-card {
  width: 100%;
  max-width: 1200px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
}

/* User Card */
.user-card {
  display: flex;
  align-items: center;
  height: 140px;
  padding: 0 40px;
}

.left-panel {
  flex: 4;
  display: flex;
  align-items: center;
  gap: 25px;
  border-right: 1px solid transparent;
}

/* =========================================
   🔥 头像与信誉外环样式 🔥
========================================= */
.avatar-container {
  position: relative;
  width: 86px;
  height: 86px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
/* 悬浮时信誉环缓慢转动 */
.avatar-container:hover .magic-ring-wrapper {
  transform: rotate(180deg);
  transition: transform 3s linear;
}
.magic-ring-wrapper {
  position: absolute;
  width: 86px;
  height: 86px;
  transition: transform 0.3s ease;
  z-index: 1;
}
/* 弱化进度条底色 */
.rep-circle :deep(.el-progress-circle__track) {
  stroke: rgba(0, 0, 0, 0.04);
}
/* 头像白边隔离 */
.avatar-inner {
  position: relative;
  z-index: 2;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* =========================================
   🔥 状态标签 (化神期旁边的呼吸点) 🔥
========================================= */
.status-badge-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  padding: 0 8px;
  border-radius: 4px;
  cursor: help;
  height: 20px;
  box-sizing: border-box;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.active {
  background-color: #52c41a;
  animation: dot-pulse 2s infinite;
}
.status-dot.sealed {
  background-color: #f5222d;
}

.status-text {
  font-size: 12px;
  color: #606266;
}

@keyframes dot-pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  color: #3e2723;
  font-weight: bold;
}

/* 🔥 UID 标签 (增加悬停和点击动效) 🔥 */
.uid-tag {
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  cursor: pointer; /* 鼠标变小手 */
  transition: all 0.2s ease;
}

.uid-tag:hover {
  background: #e6e6e6; /* 悬浮稍微加深 */
  color: #666;
}

.uid-tag:active {
  transform: scale(0.95); /* 点击时轻微回弹缩放 */
}

.tags-box {
  display: flex;
  gap: 8px;
  align-items: center;
}

.realm-badge {
  background: #faad14;
  color: #fff;
  font-size: 14px;
  padding: 0 8px;
  border-radius: 1px;
  height: 20px;
  line-height: 20px;
}

.time-box {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.vertical-divider {
  width: 1px;
  height: 60px;
  background: #eee;
  margin: 0 30px;
}

.middle-panel {
  flex: 4;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.data-label {
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
}

.help-circle {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: #eee;
  color: #999;
  border-radius: 50%;
  text-align: center;
  line-height: 14px;
  font-size: 10px;
  cursor: help;
  font-style: normal;
}

.data-value {
  font-size: 22px;
  font-weight: bold;
  color: #333;
}

.data-value.money {
  color: #cf1322;
  font-family: monospace;
}

.data-value.frozen {
  color: #69c0ff;
  font-family: monospace;
  font-size: 20px;
  margin-top: 3px;
}

.right-panel {
  flex: 3;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
}

.recharge-btn-ink {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 20px;
  background-color: #fdfbf7;
  border: 1px solid #5d4037;
  outline: 1px solid #5d4037;
  outline-offset: 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 36px;
  box-sizing: border-box;
}

.ink-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #a63434;
  color: #fff;
  font-size: 12px;
  border-radius: 3px;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;
}

.ink-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 600;
  color: #5d4037;
  letter-spacing: 2px;
  margin-right: -2px;
  transition: color 0.3s ease;
}

.recharge-btn-ink:hover {
  background-color: #fff0f0; border-color: #a63434; outline-color: #a63434;
}
.recharge-btn-ink:hover .ink-text { color: #a63434; }
.recharge-btn-ink:hover .ink-seal { transform: rotate(0deg) scale(1.1); }
.recharge-btn-ink:active { transform: translateY(1px); }

.content-card {
  padding: 30px 40px;
  min-height: 600px;
}

.tabs-bar {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-item {
  padding: 10px 5px;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  font-weight: 500;
  position: relative;
  transition: all 0.3s;
}

.tab-item:hover { color: #8b3a3a; }
.tab-item.active { color: #8b3a3a; font-weight: bold; }
.tab-item.active::after {
  content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background-color: #8b3a3a;
}

.finance-dashboard { display: flex; flex-direction: column; gap: 30px; }
.finance-summary { display: flex; gap: 20px; }

.summary-card {
  flex: 1; border-radius: 8px; padding: 20px; border: 1px solid #eee; display: flex; align-items: center; gap: 15px; transition: all 0.2s;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); }
.summary-card.income { background: #f6ffed; border-color: #b7eb8f; }
.summary-card.expense { background: #fff1f0; border-color: #ffa39e; }
.summary-card.balance { background: #e6f7ff; border-color: #91d5ff; }

.card-icon { font-size: 32px; }
.card-info { display: flex; flex-direction: column; }
.card-title { font-size: 13px; color: #666; margin-bottom: 4px; }
.card-sub { font-size: 12px; color: #999; margin-top: 4px; }
.card-num { font-size: 24px; font-weight: bold; font-family: monospace; }
.card-num.money { color: #52c41a; }
.card-num.expense-num { color: #cf1322; }
.card-num.frozen { color: #faad14; font-family: monospace; }

.chart-row { display: flex; gap: 20px; height: 350px; }
.chart-container {
  flex: 1; border: 1px solid #f0f0f0; border-radius: 8px; padding: 15px; background: #fdfdfd; display: flex; flex-direction: column;
}
.chart-title {
  font-weight: bold; font-size: 14px; color: #333; margin-bottom: 10px; border-left: 3px solid #8b3a3a; padding-left: 10px; display: flex; align-items: center; gap: 5px;
}
.echarts-box { flex: 1; width: 100%; min-height: 0; }

.table-section { margin-top: 20px; }
.section-header {
  font-weight: bold; font-size: 15px; margin-bottom: 15px; color: #5d4037; display: flex; align-items: center; justify-content: space-between;
}
.mono-font { font-family: monospace; color: #666; font-size: 13px; }
.money-font { font-family: monospace; font-weight: bold; }
.balance-snapshot { font-family: monospace; color: #333; font-weight: bold; }
.elegant-table { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.mission-title { font-weight: 500; color: #333; }
.reward-text { color: #cf1322; font-weight: bold; }
.disabled-text { color: #ccc; font-size: 12px; }

.primary-btn {
  background-color: #8b3a3a; color: #fff; border: none; padding: 8px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s; white-space: nowrap;
}
.primary-btn:hover { background-color: #a64d40; }
.primary-btn.small { padding: 4px 12px; font-size: 12px; }

.status-badge { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.status-0 { background: #e6fffb; color: #13c2c2; }
.status-1 { background: #fff7e6; color: #fa8c16; }
.status-2 { background: #e6f7ff; color: #1890ff; }
.status-3 { background: #f6ffed; color: #52c41a; }
.status-4 { background: #fff1f0; color: #f5222d; }

.audit-group { display: flex; gap: 8px; justify-content: center; }
.small-outline-btn { background: transparent; border: 1px solid #ccc; padding: 2px 8px; font-size: 12px; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
.small-outline-btn.pass { border-color: #52c41a; color: #52c41a; }
.small-outline-btn.pass:hover { background: #52c41a; color: white; }
.small-outline-btn.reject { border-color: #ff4d4f; color: #ff4d4f; }
.small-outline-btn.reject:hover { background: #ff4d4f; color: white; }

:deep(.paper-dialog) { background-color: #fdfbf7; border-radius: 2px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); border: 1px solid #efeadd; }
:deep(.paper-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.paper-dialog .el-dialog__body) { padding: 0 40px 30px; }
:deep(.paper-dialog .el-dialog__footer) { padding: 20px 40px 30px; background: transparent; }

.paper-header { text-align: center; padding: 30px 0 20px; position: relative; border-bottom: 1px dashed #dcd0b7; margin-bottom: 20px; }
.paper-title { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3e2723; }
.close-icon { position: absolute; top: 10px; right: 20px; background: transparent; border: none; font-size: 24px; color: #a1887f; cursor: pointer; }

.ink-field { border-bottom: 1px solid #d7ccc8; padding: 8px 0; transition: all 0.3s; }
.ink-field input { width: 100%; border: none; background: transparent; outline: none; font-size: 15px; color: #333; }
.ink-field:focus-within { border-bottom-color: #8b3a3a; }
.ink-field.disabled { color: #999; border-bottom-style: dashed; }
.ink-textarea-wrapper { background: rgba(255, 255, 255, 0.5); border: 1px solid #d7ccc8; border-radius: 4px; padding: 10px; }
.ink-textarea-wrapper:focus-within { border-color: #8b3a3a; background: #fff; }
.ink-textarea { width: 100%; border: none; background: transparent; outline: none; resize: none; font-size: 14px; line-height: 1.6; }

.paper-footer { display: flex; justify-content: flex-end; gap: 15px; }
.ink-btn { border: none; cursor: pointer; padding: 8px 24px; border-radius: 2px; transition: all 0.3s; }
.ink-btn.cancel { background: transparent; color: #8d6e63; }
.ink-btn.submit { background: #3e2723; color: #fff; }
.ink-btn.submit:hover { background: #5d4037; }

.recharge-content { padding: 10px 10px; }
.recharge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
.recharge-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px 0; cursor: pointer; transition: all 0.2s; background: #fff; height: 100px;
}
.recharge-item:hover { border-color: #a63434; background-color: #fffbf7; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 52, 52, 0.1); }
.recharge-item.active { border-color: #a63434; background: #fff1f0; color: #a63434; }
.gem-icon { font-size: 28px; margin-bottom: 8px; }
.gem-amount { font-weight: bold; color: #333; font-size: 16px; font-family: 'Noto Serif SC', serif; }
.rmb-price { font-size: 12px; color: #999; margin-top: 4px; }
.custom-amount-box { margin-top: 10px; padding: 0 10px; }
.reward-field { display: flex; align-items: center; justify-content: center; background: #fafafa; padding: 10px; border-radius: 4px; }
.reward-field input { width: 120px; text-align: center; background: transparent; font-family: monospace; }
</style>