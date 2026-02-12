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
          <el-button @click="$router.push('/')">返回大厅</el-button>
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
                <el-tag v-else type="success">已完成</el-tag>
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
                <el-tag v-if="row.status === 1" type="warning">进行中</el-tag>
                <el-tag v-else type="success">已完成</el-tag>
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
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {getUserInfo, getMyMissions, getMyTransactions} from '../api/user'

// --- 变量 ---
const myUserId = 2 // 暂时写死，假装我是用户2
const userInfo = ref({})
const activeTab = ref('published')

const publishedList = ref([])
const acceptedList = ref([])
const transactionList = ref([])

// --- 方法 ---

// 1. 加载基本信息
const loadUserInfo = async () => {
  const res = await getUserInfo(myUserId)
  userInfo.value = res
}

// 2. 加载我发布的 (type=1)
const loadPublished = async () => {
  const res = await getMyMissions({userId: myUserId, type: 1})
  publishedList.value = res
}

// 3. 加载我接取的 (type=2)
const loadAccepted = async () => {
  const res = await getMyMissions({userId: myUserId, type: 2})
  acceptedList.value = res
}

// 4. 加载流水
const loadTransactions = async () => {
  const res = await getMyTransactions(myUserId)
  transactionList.value = res
}

// 切换 Tab 时触发
const handleTabClick = (tab) => {
  if (tab.props.name === 'published') loadPublished()
  if (tab.props.name === 'accepted') loadAccepted()
  if (tab.props.name === 'transactions') loadTransactions()
}

// 初始化
onMounted(() => {
  loadUserInfo()
  loadPublished() // 默认加载第一个tab
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
  margin-left: auto; /* 把按钮推到最右边 */
}
</style>