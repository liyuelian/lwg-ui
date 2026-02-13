<template>
  <div class="dashboard-container">

    <div class="user-card">

      <div class="left-panel">
        <div class="avatar-container">
          <div class="avatar-border">
            <el-avatar :size="70" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          </div>
          <el-tag
              size="small"
              :type="userInfo.status === 1 ? 'success' : 'danger'"
              effect="dark"
              class="status-pill"
          >
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
          <span class="data-label">可用灵石</span>
          <span class="data-value money">{{ userInfo.balance || 0 }} 💎</span>
        </div>
        <div class="data-item">
            <span class="data-label">
              冻结押金
              <el-tooltip content="悬赏暂扣灵石，任务结束多退少补" placement="top">
                <span class="help-circle">?</span>
              </el-tooltip>
            </span>
          <span class="data-value frozen">{{ userInfo.frozenBalance || 0 }} ❄️</span>
        </div>
        <div class="data-item">
          <span class="data-label">宗门信誉</span>
          <span class="data-value">100 分</span>
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
          <span>💸 灵石账本</span>
        </div>
      </div>

      <div v-if="activeTab === 'published'" class="tab-content">
        <el-table :data="publishedList" class="elegant-table" :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column prop="title" label="榜文标题" min-width="200">
            <template #default="{ row }">
              <span class="mission-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }">
              <span class="reward-text">{{ row.reward }} 💎</span>
            </template>
          </el-table-column>
          <el-table-column label="当前状态" width="120" align="center">
            <template #default="{ row }">
              <span :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" width="160" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="宗门批复" width="180" align="center">
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
            <template #default="{ row }">
              <span class="mission-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="reward" label="悬赏" width="120" align="center">
            <template #default="{ row }">
              <span class="reward-text">{{ row.reward }} 💎</span>
            </template>
          </el-table-column>
          <el-table-column label="当前状态" width="120" align="center">
            <template #default="{ row }">
              <span :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <button
                  v-if="row.status === 1"
                  class="primary-btn small"
                  @click="openSubmitDialog(row)"
              >
                提交复命
              </button>
              <span v-else class="disabled-text">无需操作</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="activeTab === 'transactions'" class="tab-content">
        <el-table :data="transactionList" class="elegant-table" :header-cell-style="{ background: '#f8f9fa', color: '#666' }">
          <el-table-column label="收支类型" width="120" align="center">
            <template #default="{ row }">
              <span :class="['type-tag', row.amount > 0 ? 'income' : 'expense']">
                {{ row.amount > 0 ? '收入' : '支出' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="涉及金额" width="150" align="center">
            <template #default="{ row }">
                 <span class="money-font" :style="{ color: row.amount > 0 ? '#52c41a' : '#cf1322' }">
                   {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
                 </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="备注说明" min-width="200" />
          <el-table-column prop="createTime" label="记录时间" width="180" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
        </el-table>
      </div>

    </div>

    <el-dialog
        v-model="submitDialogVisible"
        width="500px"
        class="custom-dialog paper-dialog"
        :show-close="false"
        align-center
    >
      <template #header>
        <div class="paper-header">
          <div class="paper-title">提 交 复 命 书</div>
          <button class="close-icon" @click="submitDialogVisible = false">×</button>
        </div>
      </template>

      <div class="paper-content">
        <el-form :model="submitForm" label-position="top">
          <el-form-item label="任务编号">
            <div class="ink-field disabled">
              #{{ submitForm.missionId }}
            </div>
          </el-form-item>
          <el-form-item label="复命详情">
            <div class="ink-textarea-wrapper">
              <textarea v-model="submitForm.desc" class="ink-textarea" rows="4" placeholder="请详细描述任务完成情况..."></textarea>
            </div>
          </el-form-item>
          <el-form-item label="留影石链接 (凭证图片)">
            <div class="ink-field">
              <input v-model="submitForm.image" placeholder="http://..." />
            </div>
          </el-form-item>
          <el-form-item label="提交材料 (逗号分隔)">
            <div class="ink-field">
              <input v-model="submitForm.materialsRaw" placeholder="例如：妖丹, 狐皮" />
            </div>
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

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getUserInfo, getMyMissions, getMyTransactions } from '../api/user'
import { submitMission, auditMission } from '../api/mission'
import { ElMessage, ElMessageBox } from 'element-plus'

const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])
const transactionList = ref([])

const submitDialogVisible = ref(false)
const submitForm = ref({ missionId: null, desc: '', image: '', materialsRaw: '' })

// 辅助函数
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}

const formatDateSimple = (dateStr) => {
  if (!dateStr) return '未知'
  return dateStr.split('T')[0]
}

const getStatusText = (val) => ({ 0: '待接单', 1: '进行中', 2: '待验收', 3: '已完成', 4: '已取消' }[val] || '--')

// 境界映射
const getRealmText = (val) => {
  const map = {
    1: '炼气期', 2: '筑基期', 3: '金丹期', 4: '元婴期',
    5: '化神期', 6: '炼虚期', 7: '合体期', 8: '大乘期', 9: '渡劫期'
  }
  return map[val] || '凡人'
}

// 加载数据
const loadUserInfo = async () => {
  if(!myUserId) return
  const res = await getUserInfo(myUserId)
  userInfo.value = res || {}
}

const loadPublished = async () => {
  const res = await getMyMissions({userId: myUserId, type: 1})
  publishedList.value = res || []
}

const loadAccepted = async () => {
  const res = await getMyMissions({userId: myUserId, type: 2})
  acceptedList.value = res || []
}

const loadTransactions = async () => {
  const res = await getMyTransactions(myUserId)
  transactionList.value = res || []
}

watch(activeTab, (val) => {
  if (val === 'published') loadPublished()
  if (val === 'accepted') loadAccepted()
  if (val === 'transactions') loadTransactions()
}, { immediate: true })

const openSubmitDialog = (row) => {
  submitForm.value = { missionId: row.id, desc: '', image: '', materialsRaw: '' }
  submitDialogVisible.value = true
}

const handleSubmit = async () => {
  const payload = {
    missionId: submitForm.value.missionId,
    userId: myUserId,
    proofData: JSON.stringify({
      desc: submitForm.value.desc,
      image: submitForm.value.image,
      materials: submitForm.value.materialsRaw
    })
  }
  try {
    await submitMission(payload)
    ElMessage.success('复命文书已呈递！')
    submitDialogVisible.value = false
    loadAccepted()
  } catch (error) {}
}

const handleAudit = (row, isPass) => {
  ElMessageBox.prompt(
      isPass ? '确认验收通过吗？请输入评价：' : '确认驳回吗？请输入理由：',
      isPass ? '验收确认' : '驳回确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: isPass ? '道友法力无边，佩服！' : '凭证模糊，请重新提交',
      }
  ).then(async ({ value }) => {
    try {
      await auditMission({
        missionId: row.id,
        userId: myUserId,
        pass: isPass,
        remark: value
      })
      ElMessage.success(isPass ? '已验收，赏金已发放！' : '已驳回，任务重置。')
      loadPublished()
      loadUserInfo()
    } catch (error) {}
  }).catch(() => {})
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

.dashboard-container {
  width: 100%; min-height: 100vh; background-color: #f0f2f5;
  padding: 30px 20px; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}

/* ⚠️ 核心修复：两张卡片使用完全一致的宽带和盒模型 */
.user-card, .content-card {
  width: 100%;
  max-width: 1200px; /* 统一对齐大厅宽度 */
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  box-sizing: border-box; /* 👈 关键：把padding算在宽度内，防止撑开 */
  border: 1px solid #e0e0e0;
}

/* --- 1. 顶部身份铭牌 (Flex布局) --- */
.user-card {
  display: flex;
  align-items: center;
  height: 140px;
  padding: 0 40px;
}

.left-panel { flex: 4; display: flex; align-items: center; gap: 20px; }
.avatar-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avatar-border { padding: 3px; border: 2px solid #d7ccc8; border-radius: 50%; }
.status-pill { border-radius: 10px; height: 20px; line-height: 18px; padding: 0 8px; font-size: 12px; }

.info-container { display: flex; flex-direction: column; gap: 6px; }
.name-box { display: flex; align-items: center; gap: 10px; }
.username { font-family: 'Noto Serif SC', serif; font-size: 24px; color: #3e2723; font-weight: bold; }
.uid-tag { background: #f5f5f5; color: #999; font-size: 12px; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
.tags-box { display: flex; gap: 8px; }
.realm-badge { background: #faad14; color: #fff; font-size: 12px; padding: 1px 8px; border-radius: 2px; }
.role-badge { border: 1px solid #8b3a3a; color: #8b3a3a; font-size: 12px; padding: 0 8px; border-radius: 2px; }
.time-box { font-size: 12px; color: #888; margin-top: 4px; }

.vertical-divider { width: 1px; height: 60px; background: #eee; margin: 0 30px; }

.middle-panel { flex: 4; display: flex; justify-content: space-around; align-items: center; }
.data-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.data-label { font-size: 13px; color: #888; display: flex; align-items: center; gap: 4px; }
.help-circle { display: inline-block; width: 14px; height: 14px; background: #eee; color: #999; border-radius: 50%; text-align: center; line-height: 14px; font-size: 10px; cursor: help; font-style: normal; }
.data-value { font-size: 20px; font-weight: bold; color: #333; }
.data-value.money { color: #cf1322; font-family: monospace; }
.data-value.frozen { color: #69c0ff; font-family: monospace; font-size: 16px; margin-top: 3px; }

.right-panel { flex: 2; display: flex; justify-content: flex-end; }

/* --- 2. 内容卡片 --- */
.content-card {
  padding: 30px 40px;
  min-height: 500px;
}

/* Tabs */
.tabs-bar { display: flex; gap: 30px; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; }
.tab-item { padding: 10px 5px; cursor: pointer; font-size: 15px; color: #666; font-weight: 500; position: relative; transition: all 0.3s; }
.tab-item:hover { color: #8b3a3a; }
.tab-item.active { color: #8b3a3a; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background-color: #8b3a3a; }

/* 表格通用 */
.elegant-table { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.mission-title { font-weight: 500; color: #333; }
.reward-text { color: #cf1322; font-weight: bold; }
.disabled-text { color: #ccc; font-size: 12px; }

/* 状态标签 */
.status-badge { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.status-0 { background: #e6fffb; color: #13c2c2; }
.status-1 { background: #fff7e6; color: #fa8c16; }
.status-2 { background: #e6f7ff; color: #1890ff; }
.status-3 { background: #f6ffed; color: #52c41a; }
.status-4 { background: #fff1f0; color: #f5222d; }

/* 审核按钮组 */
.audit-group { display: flex; gap: 8px; justify-content: center; }
.small-outline-btn { background: transparent; border: 1px solid #ccc; padding: 2px 8px; font-size: 12px; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
.small-outline-btn.pass { border-color: #52c41a; color: #52c41a; }
.small-outline-btn.pass:hover { background: #52c41a; color: white; }
.small-outline-btn.reject { border-color: #ff4d4f; color: #ff4d4f; }
.small-outline-btn.reject:hover { background: #ff4d4f; color: white; }

/* 账本样式 */
.type-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.type-tag.income { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.type-tag.expense { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }
.money-font { font-family: monospace; font-weight: bold; font-size: 15px; }

/* 按钮 */
.primary-btn { background-color: #8b3a3a; color: #fff; border: none; padding: 8px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s; white-space: nowrap; }
.primary-btn:hover { background-color: #a64d40; }
.primary-btn.small { padding: 4px 12px; font-size: 12px; }

/* 宣纸弹窗复用 */
:deep(.paper-dialog) { background-color: #fdfbf7; border-radius: 2px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #efeadd; }
:deep(.paper-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.paper-dialog .el-dialog__body) { padding: 0 40px 30px; }
:deep(.paper-dialog .el-dialog__footer) { padding: 20px 40px 30px; background: transparent; }
.paper-header { text-align: center; padding: 30px 0 20px; position: relative; border-bottom: 1px dashed #dcd0b7; margin-bottom: 20px; }
.paper-title { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3e2723; }
.close-icon { position: absolute; top: 10px; right: 20px; background: transparent; border: none; font-size: 24px; color: #a1887f; cursor: pointer; }

/* 表单样式 */
.ink-field { border-bottom: 1px solid #d7ccc8; padding: 8px 0; transition: all 0.3s; }
.ink-field input { width: 100%; border: none; background: transparent; outline: none; font-size: 15px; color: #333; }
.ink-field:focus-within { border-bottom-color: #8b3a3a; }
.ink-field.disabled { color: #999; border-bottom-style: dashed; }
.ink-textarea-wrapper { background: rgba(255,255,255,0.5); border: 1px solid #d7ccc8; border-radius: 4px; padding: 10px; }
.ink-textarea-wrapper:focus-within { border-color: #8b3a3a; background: #fff; }
.ink-textarea { width: 100%; border: none; background: transparent; outline: none; resize: none; font-size: 14px; line-height: 1.6; }

.paper-footer { display: flex; justify-content: flex-end; gap: 15px; }
.ink-btn { border: none; cursor: pointer; padding: 8px 24px; border-radius: 2px; transition: all 0.3s; }
.ink-btn.cancel { background: transparent; color: #8d6e63; }
.ink-btn.submit { background: #3e2723; color: #fff; }
.ink-btn.submit:hover { background: #5d4037; }
</style>