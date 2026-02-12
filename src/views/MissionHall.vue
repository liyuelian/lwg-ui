<template>
  <div class="mission-container">
    <div class="mission-box">
      <!-- 头部 -->
      <div class="header">
        <div class="title-area">
          <h2 class="title">灵 务 阁 · 任务大厅</h2>
          <p class="subtitle">凡有所求，皆可悬赏</p>
        </div>

        <div class="action-buttons">
          <el-button class="plain-btn" @click="$router.push('/dashboard')">
            个人中心
          </el-button>

          <el-button class="plain-btn" @click="handleLogout">
            退出
          </el-button>

          <el-button class="primary-btn" @click="openPublishDialog">
            发布悬赏
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
          :data="tableData"
          style="width: 100%"
          v-loading="loading"
          class="ink-table"
      >
        <el-table-column prop="id" label="编号" width="80" align="center" />
        <el-table-column prop="title" label="任务标题" width="200" />
        <el-table-column prop="description" label="任务描述" show-overflow-tooltip />

        <el-table-column prop="reward" label="赏金" width="120" align="center">
          <template #default="scope">
            <span class="reward">{{ scope.row.reward }} 灵石</span>
          </template>
        </el-table-column>

        <el-table-column prop="difficulty" label="难度" width="100" align="center">
          <template #default="scope">
            <span class="difficulty">{{ difficultyText(scope.row.difficulty) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button
                v-if="scope.row.status === 0"
                class="primary-btn small-btn"
                @click="handleAccept(scope.row.id)"
            >
              抢单
            </el-button>
            <span v-else class="disabled-text">已接取</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 发布弹窗 -->
      <el-dialog
          v-model="dialogVisible"
          title="发布新悬赏"
          width="520px"
          class="ink-dialog"
      >
        <el-form :model="publishForm" label-width="90px">

          <el-form-item label="任务标题">
            <el-input v-model="publishForm.title" />
          </el-form-item>

          <el-form-item label="任务描述">
            <el-input
                v-model="publishForm.description"
                type="textarea"
                rows="3"
            />
          </el-form-item>

          <el-form-item label="赏金">
            <el-input-number v-model="publishForm.reward" :min="1" />
            <span class="unit-text">灵石</span>
          </el-form-item>

          <el-form-item label="难度">
            <el-radio-group v-model="publishForm.difficulty">
              <el-radio :label="1">简单</el-radio>
              <el-radio :label="2">普通</el-radio>
              <el-radio :label="3">困难</el-radio>
              <el-radio :label="4">地狱</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="最低境界">
            <el-radio-group v-model="publishForm.minRealm">
              <el-radio :label="1">炼气</el-radio>
              <el-radio :label="2">筑基</el-radio>
              <el-radio :label="3">金丹</el-radio>
              <el-radio :label="4">元婴</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button class="plain-btn" @click="dialogVisible = false">
            取消
          </el-button>
          <el-button class="primary-btn" @click="submitPublish">
            确认发布
          </el-button>
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

const handleLogout = () => {
  localStorage.removeItem('lwg_user_id')
  router.push('/login')
}

const dialogVisible = ref(false)

const publishForm = ref({
  publisherId: myUserId,
  title: '',
  description: '',
  reward: 10,
  difficulty: 1,
  minRealm: 1
})

const difficultyText = (val) => {
  const map = {
    1: '简单',
    2: '普通',
    3: '困难',
    4: '地狱'
  }
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
    difficulty: 1,
    minRealm: 1
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
  await acceptMission({ missionId, acceptorId: myUserId })
  ElMessage.success('抢单成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>

/* ===== 背景宣纸 ===== */
.mission-container {
  min-height: 100vh;
  background: #f6f3ee;
  display: flex;
  justify-content: center;
  padding: 60px 20px;
  font-family: "STSong", "SimSun", serif;
}

.mission-box {
  width: 1100px;
  background: #ffffff;
  border: 1px solid #e6e2dc;
  padding: 50px;
}

/* ===== 头部 ===== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  border-bottom: 1px solid #e6e2dc;
  padding-bottom: 20px;
}

.title {
  font-weight: normal;
  letter-spacing: 6px;
}

.subtitle {
  font-size: 13px;
  color: #777;
}

/* ===== 按钮风格 ===== */
.plain-btn {
  background: transparent;
  border: 1px solid #d8d3cc;
  color: #444;
}

.primary-btn {
  background: #8c3b2f;
  border: none;
  color: white;
}

.primary-btn:hover {
  background: #6f2d23;
}

.small-btn {
  padding: 4px 10px;
  font-size: 12px;
}

/* ===== 表格风格 ===== */
:deep(.el-table) {
  background: transparent;
  border: none;
}

:deep(.el-table th),
:deep(.el-table tr) {
  background: #fff;
}

.reward {
  color: #8c3b2f;
}

.difficulty {
  color: #555;
}

.disabled-text {
  color: #aaa;
}

/* ===== 弹窗风格 ===== */
:deep(.el-dialog) {
  border: 1px solid #e6e2dc;
}

.unit-text {
  margin-left: 10px;
  color: #777;
}

</style>
