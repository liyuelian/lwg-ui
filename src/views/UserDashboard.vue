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
        <span class="data-label">
          可用灵石 (Balance)
          <div class="recharge-btn-ink" @click="openRechargeDialog">
            <span class="ink-seal">纳</span>
            <span class="ink-text">灵脉灌注</span>
          </div>
        </span>
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
              <div class="card-title">累计净收入 (Real Income)</div>
              <div class="card-num money">+{{ chartStats.realIn }}</div>
              <div class="card-sub">含充值、做任务收益</div>
            </div>
          </div>
          <div class="summary-card expense">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-title">累计净支出 (Real Expense)</div>
              <div class="card-num expense-num">-{{ Math.abs(chartStats.realOut) }}</div>
              <div class="card-sub">实际消耗（不含冻结中）</div>
            </div>
          </div>
          <div class="summary-card balance">
            <div class="card-icon">🔒</div>
            <div class="card-info">
              <div class="card-title">当前冻结 (Locked)</div>
              <div class="card-num frozen">{{ chartStats.frozen }}</div>
              <div class="card-sub">悬赏押金，未消耗</div>
            </div>
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-container left">
            <div class="chart-title">
              📊 每日资金动向
              <el-tooltip content="绿色=真实进账，红色=真实出账，橙色=暂时冻结(非支出)" placement="top">
                <i class="help-circle small">?</i>
              </el-tooltip>
            </div>
            <div ref="barChartRef" class="echarts-box"></div>
          </div>
          <div class="chart-container right">
            <div class="chart-title">☯️ 交易类型构成</div>
            <div ref="pieChartRef" class="echarts-box"></div>
          </div>
        </div>

        <div class="table-section">
          <div class="section-header">
            <span>📜 交易流水明细</span>
            <div class="filter-group">
              <el-radio-group v-model="assetFilter" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="1">流动余额</el-radio-button>
                <el-radio-button label="2">冻结押金</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <el-table
              :data="filteredTransactionList"
              class="elegant-table"
              height="400"
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

            <el-table-column prop="description" label="备注" min-width="180" show-overflow-tooltip/>

          </el-table>
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

    <el-dialog
        v-model="rechargeDialogVisible"
        width="450px"
        class="custom-dialog paper-dialog"
        :show-close="false"
        align-center
    >
      <template #header>
        <div class="paper-header">
          <div class="paper-title">灵 脉 灌 注</div>
          <button class="close-icon" @click="rechargeDialogVisible = false">×</button>
        </div>
      </template>

      <div class="paper-content recharge-content">
        <div class="recharge-grid">
          <div
              v-for="amount in [6, 30, 98, 198, 328, 648]"
              :key="amount"
              :class="['recharge-item', { active: rechargeForm.amount === amount }]"
              @click="rechargeForm.amount = amount"
          >
            <div class="gem-icon">💎</div>
            <div class="gem-amount">{{ amount }} 灵石</div>
            <div class="rmb-price">¥ {{ amount }}</div>
          </div>
        </div>

        <div class="custom-amount-box">
          <div class="ink-field reward-field">
            <span class="prefix">自定义:</span>
            <input type="number" v-model="rechargeForm.amount" placeholder="输入数量"/>
            <span class="unit">灵石</span>
          </div>
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
import {ref, onMounted, watch, nextTick, computed} from 'vue'
import {getUserInfo, getMyMissions, getMyTransactions, rechargeBalance} from '../api/user'
import {submitMission, auditMission} from '../api/mission'
import {ElMessage, ElMessageBox} from 'element-plus'
import * as echarts from 'echarts'

const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])
const transactionList = ref([])
const assetFilter = ref('all') // 筛选器状态

const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChart = null
let pieChart = null

const chartStats = ref({realIn: 0, realOut: 0, frozen: 0})
const submitDialogVisible = ref(false)
const submitForm = ref({missionId: null, desc: '', image: '', materialsRaw: ''})

// 充值相关
const rechargeDialogVisible = ref(false)
const rechargeForm = ref({amount: 6})

// 辅助函数
const formatDate = (dateStr) => dateStr ? dateStr.replace('T', ' ').substring(0, 19) : ''
const formatDateSimple = (dateStr) => dateStr ? dateStr.split('T')[0] : '未知'
const getStatusText = (val) => ({0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消'}[val] || '--')
//境界
const getRealmText = (val) => ({
  1: '炼气期', 2: '筑基期', 3: '金丹期',
  4: '元婴期', 5: '化神期', 6: '炼虚期',
  7: '合体期', 8: '大乘期', 9: '渡劫期'
}[val] || '?未知境界?')

//动账类型: 1-发布悬赏, 2-结算支出, 3-任务收益, 4-任务取消/驳回退款, 5-灵石充值
const getTransactionTypeText = (type) => {
  const map = {
    1: '发布悬赏', 2: '结算支出', 3: '任务收益',
    4: '任务取消/驳回退款', 5: '灵石充值'
  }
  return map[type] || '其他'
}

// 🎨 业务类型标签颜色 (前端展示逻辑优化)
const getBizTypeTag = (type) => {
  // 真实收入 (5-充值, 3-任务收益)
  if ([5, 3].includes(type)) return 'success'
  // 真实支出 (2-结算支出)
  if ([2].includes(type)) return 'danger'
  // 内部流转/中性 (1-发布悬赏, 4-退款)
  if ([1, 4].includes(type)) return 'warning'
  return 'info'
}

// 💰 金额颜色逻辑：冻结类操作显示为橙色，不显示大红大绿
const getAmountColor = (row) => {
  // 如果是发布悬赏(1)，虽然金额是负数，但不是亏钱，用橙色
  if (row.type === 1) return '#faad14'
  if (row.amount > 0) return '#52c41a'
  return '#cf1322'
}

// 过滤后的列表
const filteredTransactionList = computed(() => {
  if (assetFilter.value === 'all') return transactionList.value
  return transactionList.value.filter(item => item.assetType == assetFilter.value)
})

const loadUserInfo = async () => {
  if (myUserId) userInfo.value = await getUserInfo(myUserId) || {}
}
const loadPublished = async () => publishedList.value = await getMyMissions({userId: myUserId, type: 1}) || []
const loadAccepted = async () => acceptedList.value = await getMyMissions({userId: myUserId, type: 2}) || []

const loadTransactions = async () => {
  const res = await getMyTransactions(myUserId)
  transactionList.value = res || []
  nextTick(() => renderCharts())
}

// 📊 核心修正：图表与统计逻辑 (完全遵循你的资产模型)
const renderCharts = () => {
  if (!transactionList.value.length) return

  let realIncome = 0
  let realExpense = 0
  // 直接取当前用户信息里的冻结余额，这个最准，不用自己累加流水
  let currentFrozen = userInfo.value.frozenBalance || 0

  const dayMap = new Map()
  const typeMap = new Map()

  transactionList.value.forEach(item => {
    const type = item.type
    const amount = item.amount
    const absAmount = Math.abs(amount)

    // 1. 统计卡片逻辑 (只算真金白银)
    // 收入：充值(5) + 任务收益(3)
    if (type === 5 || type === 3) {
      realIncome += amount
    }
    // 支出：结算支出(2)。只有这个时候钱才真正给了别人。
    // 注意：只有当 amount < 0 时才算支出 (防止某些退款逻辑干扰)
    if (type === 2 && amount < 0) {
      realExpense += amount // 这是一个负数
    }

    // 2. 饼图逻辑 (剔除内部流转产生的视觉干扰)
    let typeName = getTransactionTypeText(type)
    if (type === 1) typeName = '资金冻结(暂存)' // 改个名，让用户知道钱没丢

    typeMap.set(typeName, (typeMap.get(typeName) || 0) + absAmount)

    // 3. 柱状图逻辑 (按天归集，分类展示)
    const date = item.createTime.split('T')[0]
    if (!dayMap.has(date)) dayMap.set(date, {in: 0, out: 0, freeze: 0})
    const dayData = dayMap.get(date)

    if (type === 5 || type === 3) {
      dayData.in += amount // 真实收入
    } else if (type === 2) {
      dayData.out += absAmount // 真实支出 (取绝对值画图)
    } else if (type === 1) {
      // 统计当天的冻结量，用橙色柱子表示
      if (amount < 0) {
        dayData.freeze += absAmount
      }
    }
  })

  // 更新顶部卡片
  chartStats.value = {
    realIn: realIncome,
    realOut: realExpense, // 负数
    frozen: currentFrozen
  }

  // 渲染柱状图 (堆叠模式，增加了“冻结”柱子)
  const sortedDates = Array.from(dayMap.keys()).sort()
  const inData = sortedDates.map(d => dayMap.get(d).in)
  const outData = sortedDates.map(d => dayMap.get(d).out)
  const freezeData = sortedDates.map(d => dayMap.get(d).freeze)

  if (barChartRef.value) {
    if (barChart) barChart.dispose()
    barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {type: 'shadow'}
      },
      legend: {bottom: 0},
      grid: {top: '15%', bottom: '15%', left: '3%', right: '5%', containLabel: true},
      xAxis: {type: 'category', data: sortedDates},
      yAxis: {type: 'value'},
      series: [
        {
          name: '真实收入',
          type: 'bar',
          stack: 'total',
          data: inData,
          itemStyle: {color: '#52c41a'},
          barMaxWidth: 30
        },
        {
          name: '真实支出',
          type: 'bar',
          stack: 'total',
          data: outData,
          itemStyle: {color: '#ff4d4f'},
          barMaxWidth: 30
        },
        {
          name: '发布冻结',
          type: 'bar',
          stack: 'total',
          data: freezeData,
          itemStyle: {color: '#faad14'}, // 橙色
          barMaxWidth: 30,
          tooltip: {formatter: '{c} (暂时锁定)'}
        }
      ]
    })
  }

  // 渲染饼图
  const pieData = Array.from(typeMap.entries()).map(([name, value]) => ({name, value}))
  if (pieChartRef.value) {
    if (pieChart) pieChart.dispose()
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: {trigger: 'item'},
      legend: {bottom: 0, icon: 'circle', type: 'scroll'},
      series: [{
        name: '资金动向',
        type: 'pie',
        radius: ['40%', '65%'],
        itemStyle: {borderRadius: 5, borderColor: '#fff', borderWidth: 2},
        data: pieData,
        label: {show: false}
      }]
    })
  }
}

watch(activeTab, (val) => {
  if (val === 'published') loadPublished()
  if (val === 'accepted') loadAccepted()
  if (val === 'transactions') loadTransactions()
}, {immediate: true})

window.addEventListener('resize', () => {
  barChart && barChart.resize();
  pieChart && pieChart.resize()
})

const openSubmitDialog = (row) => {
  submitForm.value = {missionId: row.id, desc: '', image: '', materialsRaw: ''};
  submitDialogVisible.value = true
}
const handleSubmit = async () => {
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
const handleAudit = (row, isPass) => {
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

// 充值逻辑
const openRechargeDialog = () => {
  rechargeForm.value.amount = 6
  rechargeDialogVisible.value = true
}
const handleRecharge = async () => {
  if (!rechargeForm.value.amount || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请选择或输入正确的灵石数量')
    return
  }
  try {
    await rechargeBalance({
      userId: myUserId,
      amount: Number(rechargeForm.value.amount)
    })
    ElMessage.success(`成功灌注 ${rechargeForm.value.amount} 灵石！`)
    rechargeDialogVisible.value = false
    loadUserInfo()
    loadTransactions()
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

.right-panel {
  flex: 2;
  display: flex;
  justify-content: flex-end;
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
/* 🖌️ 水墨雅韵 - 充值按钮 */
.recharge-btn-ink {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: 15px;

  /* 尺寸与留白 */
  padding: 8px 24px; /* 加大尺寸，更显大气 */
  background-color: #fdfbf7; /* 米白宣纸底色 */

  /* 🖼️ 核心：双线装裱边框 */
  border: 1px solid #2c2c2c; /* 内框：墨黑 */
  outline: 1px solid #2c2c2c; /* 外框：墨黑 */
  outline-offset: 3px; /* 留出空隙 */
  border-radius: 2px;  /* 微圆角，不圆滑 */

  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

/* 🔴 印章设计 (图标) */
.ink-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  background-color: #a63434; /* 朱砂红 */
  color: #fff;
  font-size: 14px;
  font-family: 'Noto Serif SC', serif; /* 宋体/衬线 */
  border-radius: 4px; /* 模拟印章形状 */
  box-shadow: inset 0 0 4px rgba(0,0,0,0.2); /* 内阴影，模拟印泥质感 */

  /* 旋转一点点，模拟手工盖章的不规则感 */
  transform: rotate(-5deg);
  transition: transform 0.4s ease;
}

/* 📜 文字设计 */
.ink-text {
  font-family: 'Noto Serif SC', 'Songti SC', serif; /* 强制宋体 */
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2c; /* 墨色 */
  letter-spacing: 4px; /* 宽字距，显得雅致 */
  margin-right: -4px; /* 修正字距带来的右侧偏差 */
}

/* ✨ 悬停效果：墨韵晕染 */
.recharge-btn-ink:hover {
  background-color: #2c2c2c; /* 背景变黑 */
  border-color: #2c2c2c;
  outline-color: #a63434; /* 外框变红，呼应印章 */
  outline-offset: 5px; /* 扩散 */
}

/* 悬停时文字反白 */
.recharge-btn-ink:hover .ink-text {
  color: #fdfbf7;
}

/* 悬停时印章扶正并放大 */
.recharge-btn-ink:hover .ink-seal {
  transform: rotate(0deg) scale(1.1);
  background-color: #fdfbf7; /* 印章反色 */
  color: #a63434;
}

/* 点击时的反馈 */
.recharge-btn-ink:active {
  transform: scale(0.98);
  outline-offset: 2px;
}
</style>