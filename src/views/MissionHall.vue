<template>
  <div class="hall-container">
    <div class="hall-card">

      <div class="header">
        <div class="brand">
          <h2 class="title">灵务阁 · 任务大厅</h2>
          <p class="subtitle">凡有所求 · 皆可悬赏</p>
        </div>

        <div class="actions">
          <span class="user-badge" v-if="myUserId">
            <span class="dot"></span> 道友 ID: {{ myUserId }}
          </span>
          <button class="outline-btn" @click="$router.push('/dashboard')">个人中心</button>
          <button class="outline-btn" @click="handleLogout">退隐山林</button>
          <button class="primary-btn publish-btn" @click="openPublishDialog">+ 发布悬赏</button>
        </div>
      </div>

      <div class="tabs-bar">
        <div class="tab-item" :class="{ active: queryParams.status === 0 }" @click="handleSwitchTab(0)">
          <span>📜 招募中</span>
        </div>
        <div class="tab-item" :class="{ active: queryParams.status === 1 }" @click="handleSwitchTab(1)">
          <span>⚔️ 进行中</span>
        </div>
        <div class="tab-item" :class="{ active: queryParams.status === 2 }" @click="handleSwitchTab(2)">
          <span>🔍 待验证</span>
        </div>
        <div class="tab-item" :class="{ active: queryParams.status === 3 }" @click="handleSwitchTab(3)">
          <span>📃 已归档</span>
        </div>
        <div class="tab-item" :class="{ active: queryParams.status === 4 }" @click="handleSwitchTab(4)">
          <span>🍵 已取消</span>
        </div>
      </div>

      <el-table
          :data="tableData"
          style="width: 100%"
          v-loading="loading"
          class="elegant-table"
          :header-cell-style="{ background: '#f8f9fa', color: '#666', fontWeight: '500' }"
      >
        <el-table-column prop="id" label="编号" width="80" align="center">
          <template #default="{ row }">
            <span class="id-text">#{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="任务标题" min-width="180">
          <template #default="{ row }">
            <div class="title-wrapper">
              <span v-if="row.publisherId === myUserId" class="owner-badge">我发布的</span>
              <span class="mission-title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="概览" min-width="150">
          <template #default="{ row }">
             <span style="color: #888; font-size: 13px;">
               {{ row.description && row.description.length > 10 ? row.description.substring(0, 10) + '...' : row.description }}
             </span>
          </template>
        </el-table-column>

        <el-table-column prop="reward" label="赏金" width="120" align="center">
          <template #default="{ row }">
            <div class="reward-tag">
              <span class="coin-icon">💰</span> {{ row.reward }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="deadline" label="截止时间" width="160" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.deadline) || '无期限' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="minRealm" label="最低要求" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" round>{{ realmText(row.minRealm) || '不限' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <div class="operation-group">
              <button class="small-outline-btn" @click="openDetailDialog(row)">详情</button>
              <button
                  v-if="queryParams.status === 0 && row.publisherId !== myUserId"
                  class="small-primary-btn"
                  @click="handleAccept(row.id)"
              >
                接榜
              </button>
              <span v-else-if="queryParams.status !== 0" class="disabled-text">--</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
          v-model="publishDialogVisible"
          width="600px"
          class="custom-dialog paper-dialog"
          :show-close="false"
          align-center
      >
        <template #header>
          <div class="paper-header">
            <div class="paper-top-decoration"></div>
            <div class="paper-title">宗 门 悬 赏 令</div>
            <button class="close-icon" @click="publishDialogVisible = false" v-if="!isStamping">×</button>
          </div>
        </template>

        <div class="paper-content">
          <div class="center-row">
            <input v-model="publishForm.title" class="title-input" placeholder="在此输入榜文标题" />
          </div>
          <div class="center-row">
            <textarea v-model="publishForm.description" class="desc-input" rows="4" placeholder="在此详细描述任务内容、目标及特殊要求..."></textarea>
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
              <el-select v-model="publishForm.missionType" placeholder="请选择" class="ink-select" popper-class="ink-popper">
                <el-option label="降妖" :value="1" />
                <el-option label="采集" :value="2" />
                <el-option label="护送" :value="3" />
                <el-option label="其他" :value="4" />
              </el-select>
            </div>
            <div class="meta-item">
              <label>截止日期</label>
              <el-date-picker v-model="publishForm.deadline" type="datetime" placeholder="无期限" format="YYYY/MM/DD" value-format="YYYY-MM-DD HH:mm:ss" class="ink-date-picker" :teleported="false" />
            </div>
            <div class="meta-item">
              <label>最低境界</label>
              <el-select v-model="publishForm.minRealm" placeholder="炼气期" class="ink-select" popper-class="ink-popper">
                <el-option label="炼气期" :value="1" />
                <el-option label="筑基期" :value="2" />
                <el-option label="金丹期" :value="3" />
                <el-option label="元婴期" :value="4" />
                <el-option label="化神期" :value="5" />
                <el-option label="炼虚期" :value="6" />
                <el-option label="合体期" :value="7" />
                <el-option label="大乘期" :value="8" />
                <el-option label="渡劫期" :value="9" />
              </el-select>
            </div>
            <div class="meta-item">
              <label>难度等级</label>
              <div class="seal-selector">
                <span v-for="i in 3" :key="i" :class="['seal-opt', { active: publishForm.difficulty === i }]" @click="publishForm.difficulty = i">{{ difficultyText(i) }}</span>
              </div>
            </div>
          </div>
          <div class="stamp-layer" v-if="isStamping">
            <div class="stamp-mark"><div class="stamp-inner">悬赏<br>发布</div></div>
          </div>
        </div>

        <template #footer>
          <div class="paper-footer" v-if="!isStamping">
            <button class="ink-btn cancel" @click="publishDialogVisible = false">撤销</button>
            <button class="ink-btn submit" @click="handlePublishTrigger">张 贴 榜 文</button>
          </div>
          <div class="paper-footer-stamping" v-else>
            <span>正在盖印...</span>
          </div>
        </template>
      </el-dialog>

      <el-dialog v-model="detailDialogVisible" title="📜 悬赏令详情" width="800px" class="custom-dialog detail-dialog">
        <div v-if="currentMission" class="detail-content">
          <div class="detail-header">
            <div class="header-left">
              <h3 class="detail-title">
                <span class="id-tag">#{{ currentMission.id }}</span>
                {{ currentMission.title }}
                <span v-if="currentMission.publisherId === myUserId" class="owner-badge-large">我发布的</span>
              </h3>
            </div>
            <span :class="['status-badge', `status-${currentMission.status}`]">
              {{ getStatusText(currentMission.status) }}
            </span>
          </div>

          <el-descriptions border :column="3" size="default" class="info-grid">
            <el-descriptions-item label="任务类型">{{ typeText(currentMission.missionType) }}</el-descriptions-item>
            <el-descriptions-item label="难度等级">
              <span :class="['diff-tag', `diff-${currentMission.difficulty}`]">{{ difficultyText(currentMission.difficulty) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最低境界">{{ realmText(currentMission.minRealm)}}</el-descriptions-item>
            <el-descriptions-item label="赏金">
              <span class="reward-text">{{ currentMission.reward }} 灵石</span>
            </el-descriptions-item>
            <el-descriptions-item label="发布者ID">{{ currentMission.publisherId }}</el-descriptions-item>
            <el-descriptions-item label="接单者ID">{{ currentMission.acceptorId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="截止时间">{{ formatDate(currentMission.deadline) || '无期限' }}</el-descriptions-item>
          </el-descriptions>

          <div class="time-line-box">
            <div class="timeline-title">📍 任务进度流转</div>
            <el-steps :active="currentMission.status + 1" align-center class="ink-steps">
              <el-step title="榜文发布" :description="formatDate(currentMission.createTime)" />
              <el-step title="道友接榜" :description="formatDate(currentMission.acceptTime) || '等待接榜...'" />
              <el-step title="提交复命" :description="formatDate(currentMission.submitTime) || '修炼中...'" />
              <el-step title="验收完成" :description="formatDate(currentMission.finishTime) || '待结算'" />
            </el-steps>
          </div>

          <div class="section-box">
            <div class="section-title">📝 任务详情描述</div>
            <div class="section-content">{{ currentMission.description }}</div>
          </div>

          <div class="section-box" v-if="currentMission.proofData">
            <div class="section-title">📦 交付凭证</div>
            <div class="section-content">{{ currentMission.proofData }}</div>
          </div>

          <div class="section-box warning-box" v-if="currentMission.cancelReason">
            <div class="section-title" style="color: #d4380d">❌ 取消原因</div>
            <div class="section-content">{{ currentMission.cancelReason }}</div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <button class="outline-btn" @click="detailDialogVisible = false">关闭卷轴</button>
            <button v-if="currentMission?.status === 0 && currentMission?.publisherId !== myUserId" class="primary-btn" style="margin-left: 10px;" @click="handleAcceptInDetail">接榜</button>
          </div>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getMissionList, acceptMission, publishMission } from '../api/mission'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}

const loading = ref(false)
const tableData = ref([])
const router = useRouter()
const myUserId = Number(localStorage.getItem('lwg_user_id'))

const publishDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isStamping = ref(false)
const currentMission = ref(null)

const queryParams = reactive({
  status: 0,
  keyword: '',
  missionType: null,
  difficulty: null
})

const publishForm = ref({
  publisherId: myUserId,
  title: '',
  description: '',
  reward: 10,
  difficulty: 1,
  minRealm: 1,
  missionType: 1,
  deadline: null
})

const handleLogout = () => {
  localStorage.removeItem('lwg_user_id')
  router.push('/login')
}

// 字典翻译
const difficultyText = (val) => ({1: '简单', 2: '普通', 3: '困难', 4: '地狱'}[val] || '未知')
const getStatusText = (val) => ({0: '待接单', 1: '修仙中', 2: '待结算', 3: '已完成', 4: '已取消'}[val] || '--')
const realmText = (val) => ({
  1: '炼气期', 2: '筑基期', 3: '金丹期', 4: '元婴期', 5: '化神期',
  6: '炼虚期', 7: '合体期', 8: '大乘期', 9: '渡劫期',
}[val])
const typeText = (val) => ({1: '降妖', 2: '采集', 3: '护送', 4: '其他'}[val] || '未知')

const loadData = async () => {
  loading.value = true
  try {
    const list = await getMissionList(queryParams)
    tableData.value = list
  } finally {
    loading.value = false
  }
}

const handleSwitchTab = (status) => {
  queryParams.status = status
  loadData()
}

const openPublishDialog = () => {
  publishForm.value = {
    publisherId: myUserId,
    title: '',
    description: '',
    reward: 10,
    difficulty: 1,
    minRealm: 1,
    missionType: 1,
    deadline: null
  }
  isStamping.value = false
  publishDialogVisible.value = true
}

const openDetailDialog = (row) => {
  currentMission.value = row
  detailDialogVisible.value = true
}

const handleAcceptInDetail = () => {
  if(currentMission.value) {
    handleAccept(currentMission.value.id)
    detailDialogVisible.value = false
  }
}

const handlePublishTrigger = async () => {
  if (!publishForm.value.title) return ElMessage.warning('榜文不可无标题！')
  isStamping.value = true
  setTimeout(async () => {
    await submitPublish()
  }, 1200)
}

const submitPublish = async () => {
  try {
    await publishMission(publishForm.value)
    ElMessage.success('榜文张贴成功！')
    publishDialogVisible.value = false
    if (queryParams.status !== 0) handleSwitchTab(0)
    else loadData()
  } catch (error) {
    isStamping.value = false
  }
}

const handleAccept = async (missionId) => {
  try {
    await acceptMission({ missionId, acceptorId: myUserId })
    ElMessage.success('抢单成功')
    loadData()
  } catch (e) {}
}

onMounted(() => {
  if (!localStorage.getItem('lwg_user_id')) {
    router.push('/login')
    return
  }
  loadData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

/* --- 容器 & 卡片 --- */
.hall-container { width: 100%; min-height: 100vh; background-color: #f0f2f5; padding: 40px 20px; box-sizing: border-box; display: flex; justify-content: center; align-items: flex-start; }
.hall-card { width: 100%; max-width: 1200px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 40px; }

/* --- Header --- */
.header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
.title { font-family: 'Noto Serif SC', serif; font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; letter-spacing: 2px; }
.subtitle { font-size: 14px; color: #888; margin: 0; }
.actions { display: flex; align-items: center; gap: 12px; }
.user-badge { font-size: 13px; color: #666; margin-right: 15px; background: #f5f5f5; padding: 4px 10px; border-radius: 4px; }
.dot { display: inline-block; width: 6px; height: 6px; background: #52c41a; border-radius: 50%; margin-right: 4px; }

/* --- Tabs --- */
.tabs-bar { display: flex; gap: 30px; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
.tab-item { padding: 10px 5px; cursor: pointer; font-size: 15px; color: #666; font-weight: 500; position: relative; transition: all 0.3s; }
.tab-item:hover { color: #8b3a3a; }
.tab-item.active { color: #8b3a3a; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background-color: #8b3a3a; }

/* --- 按钮 --- */
.primary-btn { background-color: #8b3a3a; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.primary-btn:hover { background-color: #a64d40; transform: translateY(-1px); }
.outline-btn { background: transparent; border: 1px solid #d9d9d9; color: #666; padding: 7px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.outline-btn:hover { border-color: #8b3a3a; color: #8b3a3a; }
.small-outline-btn { background: transparent; border: 1px solid #ccc; color: #666; padding: 4px 12px; font-size: 12px; border-radius: 2px; cursor: pointer; margin-right: 8px; transition: all 0.2s; }
.small-outline-btn:hover { border-color: #333; color: #333; }
.small-primary-btn { background: #8b3a3a; border: none; color: white; padding: 4px 12px; font-size: 12px; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
.small-primary-btn:hover { background: #a64d40; }

/* --- 表格 --- */
.elegant-table { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.operation-group { display: flex; justify-content: center; align-items: center; }
.title-wrapper { display: flex; align-items: center; gap: 8px; }
.mission-title { font-weight: 500; color: #333; }
.owner-badge { font-size: 12px; color: #8b3a3a; border: 1px solid #8b3a3a; padding: 1px 5px; border-radius: 3px; transform: scale(0.9); }
.owner-badge-large { font-size: 12px; color: #fff; background: #8b3a3a; padding: 2px 8px; border-radius: 4px; margin-left: 10px; font-weight: normal; vertical-align: middle; }
.reward-tag { color: #cf1322; font-weight: bold; }
.diff-tag { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.diff-1 { background: #e6fffb; color: #13c2c2; }
.diff-2 { background: #fff7e6; color: #fa8c16; }
.diff-3 { background: #fff1f0; color: #f5222d; }
.disabled-text { color: #ccc; font-size: 12px; }
.time-text { font-size: 12px; color: #666; font-family: monospace; }

/* 宣纸弹窗样式 (保持上一次的发布样式) */
:deep(.paper-dialog) { background-color: #fdfbf7; border-radius: 2px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #efeadd; }
:deep(.paper-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.paper-dialog .el-dialog__body) { padding: 0 40px 30px; position: relative; min-height: 400px; }
:deep(.paper-dialog .el-dialog__footer) { padding: 20px 40px 30px; background: transparent; }
.paper-header { text-align: center; padding: 30px 0 20px; position: relative; margin-bottom: 20px; }
.paper-title { font-family: 'Noto Serif SC', serif; font-size: 28px; font-weight: bold; letter-spacing: 10px; color: #3e2723; }
.close-icon { position: absolute; top: 10px; right: 20px; background: transparent; border: none; font-size: 24px; color: #a1887f; cursor: pointer; }
.center-row { display: flex; justify-content: center; margin-bottom: 20px; }
.title-input { width: 80%; text-align: center; border: none; border-bottom: 2px solid #3e2723; background: transparent; font-size: 20px; font-weight: bold; color: #333; padding: 10px; font-family: 'Noto Serif SC', serif; outline: none; }
.desc-input { width: 90%; text-align: center; border: none; background: transparent; font-size: 15px; color: #555; line-height: 1.8; outline: none; resize: none; font-family: 'Noto Serif SC', serif; }
.ink-divider { height: 1px; background: repeating-linear-gradient(to right, #d7ccc8 0, #d7ccc8 5px, transparent 5px, transparent 10px); margin: 20px auto; width: 90%; }
.meta-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; width: 100%; padding-top: 10px; }
.meta-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.meta-item label { font-size: 12px; color: #8d6e63; font-weight: bold; }
.reward-field input { width: 60px; text-align: center; border: none; border-bottom: 1px solid #d7ccc8; background: transparent; font-weight: bold; color: #b71c1c; font-size: 16px; outline: none; }
.unit { font-size: 12px; color: #8d6e63; }
:deep(.ink-select .el-input__wrapper) { box-shadow: none !important; border: none; padding: 0; background: transparent; }
:deep(.ink-select .el-input__inner) { text-align: center; color: #3e2723; font-weight: bold; font-family: 'Noto Serif SC'; }
:deep(.ink-date-picker .el-input__wrapper) { box-shadow: none !important; background: transparent; padding: 0; }
:deep(.ink-date-picker .el-input__inner) { text-align: center; color: #333; cursor: pointer; }
.seal-selector { display: flex; gap: 5px; }
.seal-opt { font-size: 12px; border: 1px solid #d7ccc8; padding: 2px 6px; border-radius: 4px; cursor: pointer; color: #aaa; }
.seal-opt.active { border-color: #b71c1c; color: #b71c1c; font-weight: bold; background: rgba(183, 28, 28, 0.05); }
.paper-footer { display: flex; justify-content: center; gap: 30px; margin-top: 20px; }
.ink-btn { border: none; cursor: pointer; font-size: 16px; padding: 8px 30px; font-family: 'Noto Serif SC', serif; letter-spacing: 4px; border-radius: 2px; transition: all 0.3s; }
.ink-btn.cancel { background: transparent; color: #8d6e63; }
.ink-btn.submit { background: #3e2723; color: #fdfbf7; box-shadow: 0 4px 10px rgba(62, 39, 35, 0.3); }
.stamp-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; pointer-events: none; z-index: 10; background: rgba(253, 251, 247, 0.5); }
.stamp-mark { width: 140px; height: 140px; border: 4px solid #b71c1c; border-radius: 50%; color: #b71c1c; display: flex; justify-content: center; align-items: center; transform: scale(3); opacity: 0; animation: stamp-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.stamp-inner { font-size: 32px; font-weight: 900; writing-mode: vertical-rl; letter-spacing: 10px; border: 2px dashed #b71c1c; padding: 15px; border-radius: 50%; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; }
@keyframes stamp-in { 0% { transform: scale(3) rotate(-10deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) rotate(-5deg); opacity: 0.9; } }

/* 🌟 详情页样式补丁 & 进度图样式 🌟 */
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; }
.detail-title { font-size: 22px; font-weight: bold; color: #333; margin: 0; display: flex; align-items: center; gap: 10px; }
.id-tag { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 14px; color: #666; font-family: monospace; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; color: white; }
.status-0 { background-color: #52c41a; }
.status-1 { background-color: #fa8c16; }
.status-2 { background-color: #1890ff; }
.status-3 { background-color: #d9d9d9; color: #666; }
.info-grid :deep(.el-descriptions__label) { width: 120px; color: #888; font-weight: 500; }
.reward-text { color: #cf1322; font-weight: bold; font-size: 16px; }
.section-box { margin-top: 25px; background: #fcfcfc; border: 1px solid #f0f0f0; padding: 20px; border-radius: 4px; }
.section-title { font-weight: bold; margin-bottom: 10px; color: #333; font-size: 14px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
.section-content { color: #555; line-height: 1.7; white-space: pre-wrap; font-size: 14px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* 🌟 水墨进度图样式 (覆盖 Element Plus 默认蓝色) 🌟 */
.time-line-box {
  margin-top: 30px;
  padding: 20px 0;
  background: #fff;
}
.timeline-title {
  font-weight: bold; font-size: 14px; color: #5d4037; margin-bottom: 20px;
  padding-left: 10px; border-left: 3px solid #8b3a3a;
}
/* 改颜色 */
:deep(.ink-steps .el-step__head.is-process),
:deep(.ink-steps .el-step__head.is-wait) { color: #d7ccc8; border-color: #d7ccc8; }
:deep(.ink-steps .el-step__title.is-process),
:deep(.ink-steps .el-step__title.is-wait) { color: #aaa; font-weight: normal; }
:deep(.ink-steps .el-step__description.is-process),
:deep(.ink-steps .el-step__description.is-wait) { color: #ccc; }

/* 完成/进行中变成朱砂红 */
:deep(.ink-steps .el-step__head.is-success),
:deep(.ink-steps .el-step__head.is-finish) { color: #8b3a3a; border-color: #8b3a3a; }
:deep(.ink-steps .el-step__title.is-success),
:deep(.ink-steps .el-step__title.is-finish) { color: #8b3a3a; font-weight: bold; }
:deep(.ink-steps .el-step__line) { background-color: #eee; }
:deep(.ink-steps .el-step__line-inner) { border-color: #8b3a3a !important; }
</style>