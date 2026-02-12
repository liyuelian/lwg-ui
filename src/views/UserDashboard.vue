<template>
  <div class="dashboard-container">
    <el-card class="user-card">
      <div class="user-profile">
        <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"/>
        <div class="user-info">
          <h2>{{ userInfo.username || '道友' }}</h2>
          <div class="tags">
            <el-tag type="success">后端大能</el-tag>
            <el-tag type="warning">💰 余额: {{ userInfo.balance || 0 }} 灵石</el-tag>
          </div>
        </div>
        <div class="actions">
          <el-button @click="$router.push('/mission-hall')">返回大厅</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="data-card">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">

        <el-tab-pane label="📜 我发布的" name="published">
          <el-table :data="publishedList" stripe style="width: 100%">
            <el-table-column prop="title" label="标题"/>
            <el-table-column prop="reward" label="赏金" width="100"/>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 0">待接单</el-tag>
                <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
                <el-tag v-else-if="row.status === 2" type="primary">待验收</el-tag>
                <el-tag v-else-if="row.status === 3" type="success">完成</el-tag>
                <el-tag v-else type="info">已取消</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="发布时间" width="180"/>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="⚔️ 我接取的" name="accepted">
          <el-table :data="acceptedList" stripe style="width: 100%">
            <el-table-column prop="title" label="标题"/>
            <el-table-column prop="reward" label="赏金" width="100"/>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 0">待接单</el-tag>
                <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
                <el-tag v-else-if="row.status === 2" type="primary">待验收</el-tag>
                <el-tag v-else-if="row.status === 3" type="success">完成</el-tag>
                <el-tag v-else type="info">已取消</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button
                    v-if="row.status === 1"
                    type="success"
                    size="small"
                    @click="openSubmitDialog(row)"
                >
                  提交任务
                </el-button>
              </template>
            </el-table-column>

          </el-table>
        </el-tab-pane>

        <el-tab-pane label="💸 灵石账本" name="transactions">
          <el-table :data="transactionList" stripe style="width: 100%">
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.amount > 0 ? 'success' : 'danger'">
                  {{ row.amount > 0 ? '收入' : '支出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                 <span :style="{ color: row.amount > 0 ? 'green' : 'red', fontWeight: 'bold' }">
                   {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
                 </span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="备注"/>
            <el-table-column prop="createTime" label="交易时间" width="180"/>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <el-dialog v-model="submitDialogVisible" title="🧾 提交任务凭证" width="500px">
      <el-form :model="submitForm" label-width="80px">
        <el-form-item label="任务ID">
          <el-input v-model="submitForm.missionId" disabled/>
        </el-form-item>

        <el-form-item label="交付描述">
          <el-input
              v-model="submitForm.desc"
              type="textarea"
              rows="3"
              placeholder="例如：幸不辱命，在后山猎得三阶火灵狐一只"
          />
        </el-form-item>

        <el-form-item label="凭证图片">
          <el-input v-model="submitForm.image" placeholder="输入图片URL (这里先随便填)"/>
        </el-form-item>

        <el-form-item label="提交材料">
          <el-input
              v-model="submitForm.materialsRaw"
              placeholder="用逗号隔开，例如：妖丹,狐皮"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span>
          <el-button @click="submitDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认交付</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {getUserInfo, getMyMissions, getMyTransactions} from '../api/user'
// 引入新的 submitMission 接口
import {submitMission} from '../api/mission'
import {ElMessage} from 'element-plus'

// --- 变量 ---
const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('accepted') // 默认看接取列表，方便调试

const publishedList = ref([])
const acceptedList = ref([])
const transactionList = ref([])

// --- 提交任务相关变量 ---
const submitDialogVisible = ref(false)
const submitForm = ref({
  missionId: null,
  desc: '',
  image: 'https://via.placeholder.com/150', // 默认给个假图
  materialsRaw: '' // 前端用字符串输入，提交时转数组
})

// --- 基础加载方法 ---
const loadUserInfo = async () => {
  const res = await getUserInfo(myUserId)
  userInfo.value = res
}
const loadPublished = async () => {
  const res = await getMyMissions({userId: myUserId, type: 1})
  publishedList.value = res
}
const loadAccepted = async () => {
  const res = await getMyMissions({userId: myUserId, type: 2})
  acceptedList.value = res
}
const loadTransactions = async () => {
  const res = await getMyTransactions(myUserId)
  transactionList.value = res
}

const handleTabClick = (tab) => {
  if (tab.props.name === 'published') loadPublished()
  if (tab.props.name === 'accepted') loadAccepted()
  if (tab.props.name === 'transactions') loadTransactions()
}

// ---  提交任务逻辑 ---

// 1. 打开弹窗
const openSubmitDialog = (row) => {
  submitForm.value = {
    missionId: row.id,
    desc: '',
    image: 'https://oss.example.com/yaodan.jpg',
    materialsRaw: ''
  }
  submitDialogVisible.value = true
}

// 2. 确认提交
const handleSubmit = async () => {
  // 构造后端需要的复杂 JSON 结构
  const payload = {
    missionId: submitForm.value.missionId,
    userId: myUserId,
    proofData: {
      desc: submitForm.value.desc,
      image: submitForm.value.image,
      // 把 "妖丹,狐皮" 这种字符串切分成数组 ["妖丹", "狐皮"]
      materials: submitForm.value.materialsRaw.split(/[,，]/).filter(s => s.trim())
    }
  }

  try {
    await submitMission(payload)
    ElMessage.success('提交成功！等待雇主验收。')
    submitDialogVisible.value = false
    loadAccepted() // 刷新列表，状态应该会变 (看后端逻辑有没有改状态)
  } catch (error) {
    // request.js 会处理错误
  }
}

onMounted(() => {
  if (!myUserId) return // 防止没登录报错
  loadUserInfo()
  loadAccepted()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

.user-card {
  margin-bottom: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info h2 {
  margin: 0 0 10px 0;
}

.tags {
  display: flex;
  gap: 10px;
}

.actions {
  margin-left: auto;
}
</style>