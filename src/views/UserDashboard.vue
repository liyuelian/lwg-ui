<template>
  <div class="dashboard-container">

    <div class="user-card">
      <div class="left-panel">
        <div class="avatar-container">
          <div class="avatar-border">
            <el-avatar :size="70" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"/>
          </div>
          <el-tag size="small" :type="userInfo.status === 1 ? 'success' : 'danger'" effect="dark" class="status-pill">
            {{ userInfo.status === 1 ? '道心通明' : '封印中' }}
          </el-tag>
        </div>
        <div class="info-container">
          <div class="name-box">
            <span class="username">{{ userInfo.username || '无名道友' }}</span>
            <span class="uid-tag">UID: {{ myUserId }}</span>
          </div>
          <div class="tags-box">
            <span class="realm-badge">{{ getRealmText(userInfo.realm) }}</span>
            <span class="role-badge">炼丹师</span>
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
              <el-tooltip content="任务保证金，完结后扣除或退回" placement="top"><i
                  class="help-circle">?</i></el-tooltip>
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
        <el-table :data="publishedList" class="elegant-table"
                  :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column prop="title" label="榜文标题" min-width="200">
            <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }"><span class="reward-text">{{ row.reward }} 💎</span></template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }"><span
                :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span></template>
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
        <el-table :data="acceptedList" class="elegant-table"
                  :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column prop="title" label="榜文标题" min-width="200">
            <template #default="{ row }"><span class="mission-title">{{ row.title }}</span></template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }"><span class="reward-text">{{ row.reward }} 💎</span></template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }"><span
                :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span></template>
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
            <div class="chart-title">
              📊 近12个月资金动向
            </div>
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
              <template #default="{ row }">
                <span class="mono-font">{{ formatDate(row.createTime) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="type" label="业务类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getBizTypeTag(row.type)" effect="plain" size="small">
                  {{ getTransactionTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="变动金额" width="130" align="right">
              <template #default="{ row }">
                  <span class="money-font" :style="{ color: getAmountColor(row), fontSize: '15px' }">
                    {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
                  </span>
              </template>
            </el-table-column>

            <el-table-column prop="assetType" label="影响账户" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.assetType === 1 ? 'success' : 'primary'" effect="light" size="small" round>
                  {{ row.assetType === 1 ? '可用' : '冻结' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="balanceAfter" label="变动后余额" width="130" align="right">
              <template #default="{ row }">
                <span class="balance-snapshot">{{ row.balanceAfter !== undefined ? row.balanceAfter : '--' }}</span>
              </template>
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

    <el-dialog v-model="submitDialogVisible" width="500px" class="custom-dialog paper-dialog" :show-close="false"
               align-center>
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
            <div class="ink-textarea-wrapper"><textarea v-model="submitForm.desc" class="ink-textarea" rows="4"
                                                        placeholder="请详细描述任务完成情况..."></textarea></div>
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

    <el-dialog v-model="rechargeDialogVisible" width="450px" class="custom-dialog paper-dialog" :show-close="false"
               align-center>
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
          <div class="ink-field reward-field"><span class="prefix">自定义:</span><input type="number"
                                                                                        v-model="rechargeForm.amount"
                                                                                        placeholder="输入数量"/><span
              class="unit">灵石</span></div>
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
// 🆕 引入新的API (假设你已经加到了 api/user.js)
import {
  getUserInfo, getMyMissions, rechargeBalance,
  getFinanceOverview, getTransactionList, getFinanceCharts
} from '../api/user'
import {submitMission, auditMission} from '../api/mission'
import {ElMessage, ElMessageBox} from 'element-plus'
import * as echarts from 'echarts'

const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])

// 🆕 财务模块新的 State 定义
const transactionList = ref([])
const total = ref(0) // 总条数
const loading = ref(false)
const dateRange = ref([])
// 概览数据 (对应 FinanceOverviewVO)
const overview = ref({
  totalIncome: 0, totalExpense: 0, monthIncome: 0, monthExpense: 0
})
// 查询参数 (对应 TransactionPageReq)
const queryParams = ref({
  userId: myUserId,
  page: 1,
  pageSize: 10,
  category: 'all', // 对应后端的 income, expense, locked, all
  startDate: null,
  endDate: null
})

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

// --- 你的枚举和辅助函数 (完全保留) ---
const formatDate = (dateStr) => dateStr ? dateStr.replace('T', ' ').substring(0, 19) : ''
const formatDateSimple = (dateStr) => dateStr ? dateStr.split('T')[0] : '未知'
const getStatusText = (val) => ({0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消'}[val] || '--')
const getRealmText = (val) => ({
  1: '炼气期', 2: '筑基期', 3: '金丹期',
  4: '元婴期', 5: '化神期', 6: '炼虚期',
  7: '合体期', 8: '大乘期', 9: '渡劫期'
}[val] || '?未知境界?')
// 你的动账类型枚举 (后端现在支持6了，这里你可以根据需要加，不加也不影响运行)
const getTransactionTypeText = (type) => {
  const map = {
    1: '发布悬赏', 2: '结算支出', 3: '任务收益',
    4: '任务取消/驳回退款', 5: '灵石充值', 6: '系统赠送' // 我顺手帮你把6加上了，防止显示"其他"
  }
  return map[type] || '其他'
}
const getBizTypeTag = (type) => {
  if ([5, 3, 6].includes(type)) return 'success'
  if ([2].includes(type)) return 'danger'
  if ([1, 4].includes(type)) return 'warning'
  return 'info'
}
const getAmountColor = (row) => {
  if (row.type === 1) return '#faad14'
  if (row.amount > 0) return '#52c41a'
  return '#cf1322'
}
// --- 枚举结束 ---


// --- 核心逻辑替换区 ---

const loadUserInfo = async () => {
  if (myUserId) userInfo.value = await getUserInfo(myUserId) || {}
}
const loadPublished = async () => publishedList.value = await getMyMissions({userId: myUserId, type: 1}) || []
const loadAccepted = async () => acceptedList.value = await getMyMissions({userId: myUserId, type: 2}) || []

// 🆕 1. 加载概览数据
const loadOverview = async () => {
  const res = await getFinanceOverview(myUserId)
  console.log(res)
  if (res) { // 假设你的request封装返回的是res或者res.data
    // 兼容处理：如果你的request拦截器直接返回data层，就去掉.data
    const data = res.data || res
    overview.value = data
  }
}

// 🆕 2. 加载流水列表 (服务端分页)
const loadTransactions = async () => {
  loading.value = true

  // 处理时间
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
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 🆕 3. 筛选变更
const handleSearch = () => {
  queryParams.value.page = 1 // 重置第一页
  loadTransactions()
}

// 🆕 4. 渲染图表 (直接用后端数据)
const renderCharts = async () => {
  // 调接口
  const res = await getFinanceCharts(myUserId)
  const data = res.data || res

  // A. 渲染折线图 (Trend)
  if (barChartRef.value) {
    if (barChart) barChart.dispose()
    barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: {trigger: 'axis'},
      legend: {bottom: 0},
      grid: {top: '15%', bottom: '15%', left: '3%', right: '5%', containLabel: true},
      xAxis: {type: 'category', data: data.trendMonths}, // 后端补全好的月份
      yAxis: {type: 'value'},
      series: [
        {
          name: '收入',
          type: 'line', // 折线图更能体现趋势
          smooth: true,
          data: data.trendIncome,
          itemStyle: {color: '#52c41a'},
          areaStyle: {opacity: 0.1} // 加个阴影更好看
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          data: data.trendExpense,
          itemStyle: {color: '#ff4d4f'},
          areaStyle: {opacity: 0.1}
        }
      ]
    })
  }

  // B. 渲染饼图 (Pie)
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
        data: data.pieData, // 后端已经把 name 换成中文了
        label: {show: false}
      }]
    })
  }
}

// 监听 Tab 切换
watch(activeTab, (val) => {
  if (val === 'published') loadPublished()
  if (val === 'accepted') loadAccepted()
  if (val === 'transactions') {
    loadOverview()     // 查概览
    loadTransactions() // 查表格
    nextTick(() => renderCharts()) // 查图表
  }
}, {immediate: true})

// 窗口大小自适应
window.addEventListener('resize', () => {
  barChart && barChart.resize();
  pieChart && pieChart.resize()
})

// --- 原有的弹窗逻辑 (完全保留) ---
const openSubmitDialog = (row) => {
  submitForm.value = {missionId: row.id, desc: '', image: '', materialsRaw: ''};
  submitDialogVisible.value = true
}
const handleSubmit = async () => { /* ...原逻辑... */
  try {
    await submitMission({
      missionId: submitForm.value.missionId,
      userId: myUserId,
      proofData: JSON.stringify({
        desc: submitForm.value.desc,
        image: submitForm.value.image,
        materials: submitForm.value.materialsRaw
      })
    });
    ElMessage.success('已呈递！');
    submitDialogVisible.value = false;
    loadAccepted()
  } catch (e) {
  }
}
const handleAudit = (row, isPass) => { /* ...原逻辑... */
  ElMessageBox.prompt(isPass ? '确认验收？' : '确认驳回？', '批复', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async ({value}) => {
    try {
      await auditMission({missionId: row.id, userId: myUserId, pass: isPass, remark: value});
      ElMessage.success('批复已下达');
      loadPublished();
      loadUserInfo()
    } catch (e) {
    }
  }).catch(() => {
  })
}
const openRechargeDialog = () => {
  rechargeForm.value.amount = 6;
  rechargeDialogVisible.value = true
}
const handleRecharge = async () => { /* ...原逻辑... */
  if (!rechargeForm.value.amount || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请选择或输入正确的灵石数量');
    return
  }
  try {
    await rechargeBalance({userId: myUserId, amount: Number(rechargeForm.value.amount)});
    ElMessage.success(`成功灌注 ${rechargeForm.value.amount} 灵石！`);
    rechargeDialogVisible.value = false;
    loadUserInfo();
    if (activeTab.value === 'transactions') {
      loadOverview();
      loadTransactions();
      renderCharts();
    }
  } catch (error) {
  }
}

onMounted(() => {
  loadUserInfo()
})
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
  gap: 20px;
  border-right: 1px solid transparent;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-border {
  padding: 3px;
  border: 2px solid #d7ccc8;
  border-radius: 50%;
}

.status-pill {
  border-radius: 10px;
  height: 20px;
  line-height: 18px;
  padding: 0 8px;
  font-size: 12px;
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

.uid-tag {
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.tags-box {
  display: flex;
  gap: 8px;
}

.realm-badge {
  background: #faad14;
  color: #fff;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 2px;
}

.role-badge {
  border: 1px solid #8b3a3a;
  color: #8b3a3a;
  font-size: 12px;
  padding: 0 8px;
  border-radius: 2px;
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
  font-size: 20px;
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
  font-size: 16px;
  margin-top: 3px;
}

/* 🆕 右侧面板布局优化 */
.right-panel {
  flex: 3; /* 稍微给宽一点 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px; /* 两个按钮之间的间距 */
}

/* 🖌️ 水墨雅韵 - 充值按钮 (新版) */
.recharge-btn-ink {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 6px 20px; /* 尺寸适中 */
  background-color: #fdfbf7; /* 米白宣纸底色 */

  /* 双线装裱边框 */
  border: 1px solid #5d4037; /* 边框改浅一点的墨褐色 */
  outline: 1px solid #5d4037;
  outline-offset: 2px;
  border-radius: 2px;

  cursor: pointer;
  transition: all 0.3s ease;
  height: 36px; /* 固定高度，与大厅按钮对齐 */
  box-sizing: border-box;
}

/* 印章 */
.ink-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #a63434; /* 朱砂红 */
  color: #fff;
  font-size: 12px;
  border-radius: 3px;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;
}

/* 文字 */
.ink-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 600;
  color: #5d4037; /* 墨褐色，比纯黑柔和 */
  letter-spacing: 2px;
  margin-right: -2px;
  transition: color 0.3s ease;
}

/* ✨ 悬停效果：朱砂红韵 (不再变黑) */
.recharge-btn-ink:hover {
  background-color: #fff0f0; /* 极淡的红色背景 */
  border-color: #a63434; /* 边框变朱红 */
  outline-color: #a63434; /* 外框变朱红 */
}

.recharge-btn-ink:hover .ink-text {
  color: #a63434; /* 文字变朱红 */
}

.recharge-btn-ink:hover .ink-seal {
  transform: rotate(0deg) scale(1.1); /* 印章扶正 */
}

.recharge-btn-ink:active {
  transform: translateY(1px);
}

.plus-icon {
  font-weight: bold;
  font-style: normal;
}

/* Content Card */
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

.tab-item:hover {
  color: #8b3a3a;
}

.tab-item.active {
  color: #8b3a3a;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #8b3a3a;
}

/* 🆕 灵石对账看板样式 */
.finance-dashboard {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.finance-summary {
  display: flex;
  gap: 20px;
}

.summary-card {
  flex: 1;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.summary-card.income {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.summary-card.expense {
  background: #fff1f0;
  border-color: #ffa39e;
}

.summary-card.balance {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.card-icon {
  font-size: 32px;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.card-num {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
}

.card-num.money {
  color: #52c41a;
}

.card-num.expense-num {
  color: #cf1322;
}

/* 增加 frozen 样式 */
.card-num.frozen {
  color: #faad14;
  font-family: monospace;
}

/* 图表区 */
.chart-row {
  display: flex;
  gap: 20px;
  height: 350px;
}

.chart-container {
  flex: 1;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  background: #fdfdfd;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  border-left: 3px solid #8b3a3a;
  padding-left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.help-circle.small {
  width: 14px;
  height: 14px;
  font-size: 10px;
  line-height: 14px;
}

.echarts-box {
  flex: 1;
  width: 100%;
  min-height: 0;
}

/* 列表区 */
.table-section {
  margin-top: 20px;
}

.section-header {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 15px;
  color: #5d4037;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mono-font {
  font-family: monospace;
  color: #666;
  font-size: 13px;
}

.money-font {
  font-family: monospace;
  font-weight: bold;
}

.balance-snapshot {
  font-family: monospace;
  color: #333;
  font-weight: bold;
}

/* 通用样式 */
.elegant-table {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.mission-title {
  font-weight: 500;
  color: #333;
}

.reward-text {
  color: #cf1322;
  font-weight: bold;
}

.disabled-text {
  color: #ccc;
  font-size: 12px;
}

.primary-btn {
  background-color: #8b3a3a;
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.primary-btn:hover {
  background-color: #a64d40;
}

.primary-btn.small {
  padding: 4px 12px;
  font-size: 12px;
}

.status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-0 {
  background: #e6fffb;
  color: #13c2c2;
}

.status-1 {
  background: #fff7e6;
  color: #fa8c16;
}

.status-2 {
  background: #e6f7ff;
  color: #1890ff;
}

.status-3 {
  background: #f6ffed;
  color: #52c41a;
}

.status-4 {
  background: #fff1f0;
  color: #f5222d;
}

.audit-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.small-outline-btn {
  background: transparent;
  border: 1px solid #ccc;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.small-outline-btn.pass {
  border-color: #52c41a;
  color: #52c41a;
}

.small-outline-btn.pass:hover {
  background: #52c41a;
  color: white;
}

.small-outline-btn.reject {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.small-outline-btn.reject:hover {
  background: #ff4d4f;
  color: white;
}

:deep(.paper-dialog) {
  background-color: #fdfbf7;
  border-radius: 2px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #efeadd;
}

:deep(.paper-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.paper-dialog .el-dialog__body) {
  padding: 0 40px 30px;
}

:deep(.paper-dialog .el-dialog__footer) {
  padding: 20px 40px 30px;
  background: transparent;
}

.paper-header {
  text-align: center;
  padding: 30px 0 20px;
  position: relative;
  border-bottom: 1px dashed #dcd0b7;
  margin-bottom: 20px;
}

.paper-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 5px;
  color: #3e2723;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 24px;
  color: #a1887f;
  cursor: pointer;
}

.ink-field {
  border-bottom: 1px solid #d7ccc8;
  padding: 8px 0;
  transition: all 0.3s;
}

.ink-field input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: #333;
}

.ink-field:focus-within {
  border-bottom-color: #8b3a3a;
}

.ink-field.disabled {
  color: #999;
  border-bottom-style: dashed;
}

.ink-textarea-wrapper {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #d7ccc8;
  border-radius: 4px;
  padding: 10px;
}

.ink-textarea-wrapper:focus-within {
  border-color: #8b3a3a;
  background: #fff;
}

.ink-textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}

.paper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.ink-btn {
  border: none;
  cursor: pointer;
  padding: 8px 24px;
  border-radius: 2px;
  transition: all 0.3s;
}

.ink-btn.cancel {
  background: transparent;
  color: #8d6e63;
}

.ink-btn.submit {
  background: #3e2723;
  color: #fff;
}

.ink-btn.submit:hover {
  background: #5d4037;
}

/* 🛠️ 充值弹窗样式修复 */
.recharge-content {
  padding: 10px 10px;
}

.recharge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 强制分为3列 */
  gap: 15px;
  margin-bottom: 25px;
}

.recharge-item {
  display: flex;
  flex-direction: column; /* 垂直排列图标和文字 */
  align-items: center;
  justify-content: center;

  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px 0;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  height: 100px; /* 固定高度，防止塌陷 */
}

.recharge-item:hover {
  border-color: #a63434;
  background-color: #fffbf7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 52, 52, 0.1);
}

.recharge-item.active {
  border-color: #a63434;
  background: #fff1f0;
  color: #a63434;
}

.gem-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.gem-amount {
  font-weight: bold;
  color: #333;
  font-size: 16px;
  font-family: 'Noto Serif SC', serif;
}

.rmb-price {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 自定义金额输入框修复 */
.custom-amount-box {
  margin-top: 10px;
  padding: 0 10px;
}

.reward-field {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 10px;
  border-radius: 4px;
}

.reward-field input {
  width: 120px;
  text-align: center;
  background: transparent;
  font-family: monospace;
}
</style>