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
                <el-tag v-else-if="row.status === 3" type="success">已完成</el-tag>
                <el-tag v-else type="info">已关闭</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="createTime" label="发布时间" width="180" />

            <el-table-column label="操作" width="180" align="center">
              <template #default="{ row }">
                <div v-if="row.status === 2">
                  <el-button type="success" size="small" @click="handleAudit(row, true)">
                    通过
                  </el-button>
                  <el-button type="danger" size="small" @click="handleAudit(row, false)">
                    驳回
                  </el-button>
                </div>
                <span v-else style="color: #999; font-size: 12px">--</span>
              </template>
            </el-table-column>

          </el-table>
        </el-tab-pane>

        <el-tab-pane label="⚔️ 我接取的" name="accepted">
          <el-table :data="acceptedList" stripe style="width: 100%">
            <el-table-column prop="title" label="标题"/>
            <el-table-column prop="reward" label="赏金" width="100"/>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 1" type="warning">进行中</el-tag>
                <el-tag v-else-if="row.status === 2" type="primary">待验收</el-tag>
                <el-tag v-else type="success">已完成</el-tag>
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
            <el-table-column prop="description" label="备注" />
            <el-table-column prop="createTime" label="交易时间" width="180" />
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
          <el-input v-model="submitForm.desc" type="textarea" rows="3" />
        </el-form-item>

        <el-form-item label="凭证图片">
          <el-input v-model="submitForm.image" placeholder="URL" />
        </el-form-item>
        <el-form-item label="提交材料">
          <el-input v-model="submitForm.materialsRaw" placeholder="用逗号隔开" />
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
import { ref, onMounted } from 'vue'
import { getUserInfo, getMyMissions, getMyTransactions } from '../api/user'
// 引入新的 auditMission 接口
import { submitMission, auditMission } from '../api/mission'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 变量 ---
const myUserId = Number(localStorage.getItem('lwg_user_id'))
const userInfo = ref({})
const activeTab = ref('published') // 默认看发布的，方便验收

const publishedList = ref([])
const acceptedList = ref([])
const transactionList = ref([])

// --- 提交任务相关变量 ---
const submitDialogVisible = ref(false)
const submitForm = ref({ missionId: null, desc: '', image: '', materialsRaw: '' })

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

// --- 提交任务逻辑 (打工仔) ---
const openSubmitDialog = (row) => {
  submitForm.value = { missionId: row.id, desc: '', image: 'https://via.placeholder.com/150', materialsRaw: '' }
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
    ElMessage.success('提交成功！')
    submitDialogVisible.value = false
    loadAccepted()
  } catch (error) {}
}

// --- 🆕 审核任务逻辑 (老板) ---
const handleAudit = (row, isPass) => {
  // 使用 ElementPlus 自带的 prompt 弹窗输入备注
  ElMessageBox.prompt(
      isPass ? '确认验收通过吗？请输入评价：' : '确认驳回吗？请输入理由：',
      isPass ? '验收确认' : '驳回确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: isPass ? '验收通过，合作愉快' : '材料不足，请补充', // 默认文案
      }
  ).then(async ({ value }) => {
    // 用户点了确定，value 就是输入的备注
    try {
      await auditMission({
        missionId: row.id,
        userId: myUserId,
        pass: isPass,
        remark: value
      })

      ElMessage.success(isPass ? '已验收，灵石已发放！' : '已驳回，任务重置。')

      // 验收完，刷新一下列表和余额（因为钱可能少了）
      loadPublished()
      loadUserInfo()
    } catch (error) {
      // request.js 处理错误
    }
  }).catch(() => {
    // 用户点了取消，啥也不做
  })
}

onMounted(() => {
  if(!myUserId) return
  loadUserInfo()
  loadPublished()
})
</script>

<style scoped>
.dashboard-container { max-width: 1000px; margin: 20px auto; padding: 0 20px; }
.user-card { margin-bottom: 20px; }
.user-profile { display: flex; align-items: center; gap: 20px; }
.tags { display: flex; gap: 10px; }
.actions { margin-left: auto; }
</style>