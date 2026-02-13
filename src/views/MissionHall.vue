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

          <button class="outline-btn" @click="$router.push('/dashboard')">
            个人中心
          </button>

          <button class="outline-btn" @click="handleLogout">
            退隐山林
          </button>

          <button class="primary-btn publish-btn" @click="openPublishDialog">
            + 发布悬赏
          </button>
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
            <span class="mission-title">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="详情" show-overflow-tooltip min-width="200" />

        <el-table-column prop="reward" label="赏金" width="140" align="center">
          <template #default="{ row }">
            <div class="reward-tag">
              <span class="coin-icon">💰</span> {{ row.reward }} 灵石
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="difficulty" label="难度" width="100" align="center">
          <template #default="{ row }">
            <span :class="['diff-tag', `diff-${row.difficulty}`]">
              {{ difficultyText(row.difficulty) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <button
                v-if="row.status === 0"
                class="action-link-btn"
                @click="handleAccept(row.id)"
            >
              接榜
            </button>
            <span v-else class="disabled-text">已接取</span>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
          v-model="dialogVisible"
          title="📝 发布新悬赏"
          width="500px"
          class="custom-dialog"
      >
        <el-form :model="publishForm" label-position="top">

          <el-form-item label="任务标题">
            <div class="input-wrapper">
              <input v-model="publishForm.title" class="minimal-input" placeholder="请输入简短标题" />
            </div>
          </el-form-item>

          <el-form-item label="任务描述">
            <div class="input-wrapper">
              <textarea
                  v-model="publishForm.description"
                  class="minimal-input minimal-textarea"
                  rows="3"
                  placeholder="请详细描述任务要求..."
              ></textarea>
            </div>
          </el-form-item>

          <div class="form-row">
            <el-form-item label="赏金 (灵石)">
              <div class="input-wrapper">
                <input type="number" v-model="publishForm.reward" class="minimal-input" />
              </div>
            </el-form-item>

            <el-form-item label="难度">
              <el-radio-group v-model="publishForm.difficulty">
                <el-radio-button :label="1">简单</el-radio-button>
                <el-radio-button :label="2">困难</el-radio-button>
                <el-radio-button :label="3">地狱</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>

        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <button class="outline-btn" @click="dialogVisible = false">取消</button>
            <button class="primary-btn" @click="submitPublish">确认发布</button>
          </div>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMissionList, acceptMission, publishMission } from '../api/mission'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const loading = ref(false)
const tableData = ref([])
const router = useRouter()
const myUserId = Number(localStorage.getItem('lwg_user_id'))
const dialogVisible = ref(false)

const publishForm = ref({
  publisherId: myUserId,
  title: '',
  description: '',
  reward: 10,
  difficulty: 1
})

const handleLogout = () => {
  localStorage.removeItem('lwg_user_id')
  router.push('/login')
}

const difficultyText = (val) => {
  const map = { 1: '简单', 2: '困难', 3: '地狱' }
  return map[val] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const list = await getMissionList({ status: 0 })
    tableData.value = list
  } finally {
    loading.value = false
  }
}

const openPublishDialog = () => {
  publishForm.value = {
    publisherId: myUserId,
    title: '',
    description: '',
    reward: 10,
    difficulty: 1
  }
  dialogVisible.value = true
}

const submitPublish = async () => {
  if (!publishForm.value.title) {
    ElMessage.warning('请输入任务标题')
    return
  }
  await publishMission(publishForm.value)
  ElMessage.success('发布成功')
  dialogVisible.value = false
  loadData()
}

const handleAccept = async (missionId) => {
  try {
    await acceptMission({ missionId, acceptorId: myUserId })
    ElMessage.success('抢单成功')
    loadData()
  } catch (e) {
    //
  }
}

onMounted(() => {
  // 如果没有登录，跳回登录页
  if (!localStorage.getItem('lwg_user_id')) {
    router.push('/login')
    return
  }
  loadData()
})
</script>

<style scoped>
/* 引入字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

/* --- 全局容器：护眼灰 --- */
.hall-container {
  /* 关键：宽度100%，最小高度100视窗高度 */
  width: 100%;
  min-height: 100vh;

  /* 关键：使用 Flex 布局来居中内容 */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 顶对齐，防止长列表被切掉 */

  background-color: #f0f2f5;
  padding: 40px 20px;
  box-sizing: border-box; /* 防止 padding 撑破宽度 */
}

/* --- 白卡片 --- */
.hall-card {
  width: 100%;
  max-width: 1200px; /* 限制最大宽度 */
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 40px;
}

/* --- 头部区域 --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.title {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}
.subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 13px;
  color: #666;
  margin-right: 15px;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
}
.dot {
  display: inline-block; width: 6px; height: 6px; background: #52c41a; border-radius: 50%; margin-right: 4px;
}

/* --- 按钮体系 --- */
.primary-btn {
  background-color: #8b3a3a;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.primary-btn:hover { background-color: #a64d40; transform: translateY(-1px); }

.outline-btn {
  background: transparent;
  border: 1px solid #d9d9d9;
  color: #666;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.outline-btn:hover { border-color: #8b3a3a; color: #8b3a3a; }

.action-link-btn {
  background: transparent;
  border: 1px solid #8b3a3a;
  color: #8b3a3a;
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.action-link-btn:hover { background: #8b3a3a; color: white; }

/* --- 表格样式定制 --- */
.elegant-table {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.id-text { color: #999; font-family: monospace; }
.mission-title { font-weight: 500; color: #333; }
.reward-tag { color: #cf1322; font-weight: bold; }
.diff-tag {
  font-size: 12px; padding: 2px 8px; border-radius: 10px;
}
.diff-1 { background: #e6fffb; color: #13c2c2; } /* 简单-青色 */
.diff-2 { background: #fff7e6; color: #fa8c16; } /* 困难-橙色 */
.diff-3 { background: #fff1f0; color: #f5222d; } /* 地狱-红色 */

.disabled-text { color: #ccc; font-size: 12px; }

/* --- 弹窗样式 --- */
.input-wrapper {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 10px;
  transition: all 0.3s;
}
.input-wrapper:focus-within { border-color: #8b3a3a; background: #fff; }

.minimal-input {
  width: 100%; border: none; background: transparent; padding: 8px 0; outline: none; font-size: 14px;
}
.minimal-textarea { resize: none; }

.form-row { display: flex; gap: 20px; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* 覆盖 Element Radio 样式，让它变红 */
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #8b3a3a;
  border-color: #8b3a3a;
  box-shadow: -1px 0 0 0 #8b3a3a;
}
</style>