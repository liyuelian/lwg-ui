<template>
  <div class="mission-hall">
    <div class="header">
      <h2>📜 灵务阁 - 任务大厅</h2>
      <div>
        <el-button type="danger" plain @click="handleLogout" style="margin-right: 10px">
          退出
        </el-button>
        <el-button type="info" @click="$router.push('/dashboard')" style="margin-right: 10px">
          👤 个人中心
        </el-button>

        <el-button type="primary" size="large" @click="openPublishDialog">
          + 发布悬赏
        </el-button>
      </div>
    </div>

    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="任务ID" width="80" align="center"/>
      <el-table-column prop="title" label="任务标题" width="200"/>
      <el-table-column prop="description" label="任务描述" show-overflow-tooltip/>
      <el-table-column prop="reward" label="赏金 (灵石)" width="120" align="center">
        <template #default="scope">
          <el-tag type="warning">💰 {{ scope.row.reward }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="difficulty" label="难度" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.difficulty === 1">简单</el-tag>
          <el-tag v-else-if="scope.row.difficulty === 2" type="warning">普通</el-tag>
          <el-tag v-else-if="scope.row.difficulty === 3" type="info">困难</el-tag>
          <el-tag v-else-if="scope.row.difficulty === 4" type="danger">地狱</el-tag>
          <el-tag v-else type="danger">???</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <el-button
              v-if="scope.row.status === 0"
              type="primary"
              size="small"
              @click="handleAccept(scope.row.id)"
          >
            抢单
          </el-button>
          <el-tag v-else type="info">不可接取</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
        v-model="dialogVisible"
        title="发布新悬赏"
        width="500px"
    >
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="任务标题">
          <el-input v-model="publishForm.title" placeholder="例如：寻找走失的灵宠"/>
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input
              v-model="publishForm.description"
              type="textarea"
              rows="3"
              placeholder="请详细描述任务内容..."
          />
        </el-form-item>

        <el-form-item label="赏金">
          <el-input-number v-model="publishForm.reward" :min="1" label="灵石数量"/>
          <span style="margin-left: 10px">灵石</span>
        </el-form-item>

        <el-form-item label="难度">
          <el-radio-group v-model="publishForm.difficulty">
            <el-radio :label="1">简单</el-radio>
            <el-radio :label="2">普通</el-radio>
            <el-radio :label="3">困难</el-radio>
            <el-radio :label="4">地狱</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="最低境界要求">
          <el-radio-group v-model="publishForm.minRealm">
            <el-radio :label="1">炼气</el-radio>
            <el-radio :label="2">筑基</el-radio>
            <el-radio :label="3">金丹</el-radio>
            <el-radio :label="4">元婴</el-radio>
            <el-radio :label="5">化神</el-radio>
            <el-radio :label="6">炼虚</el-radio>
            <el-radio :label="7">合体</el-radio>
            <el-radio :label="8">大乘</el-radio>
            <el-radio :label="9">渡劫</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPublish">确认发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {getMissionList, acceptMission, publishMission} from '../api/mission'
import {ElMessage} from 'element-plus'
import {useRouter} from 'vue-router'

// --- 变量定义区  ---
const loading = ref(false)   // 加载状态
const tableData = ref([])    // 表格数据 (List<Mission>)
const router = useRouter()
// 从缓存拿 ID，转成数字
const myUserId = Number(localStorage.getItem('lwg_user_id'))
// 退出登录方法
const handleLogout = () => {
  localStorage.removeItem('lwg_user_id')
  router.push('/login')
}


// --- 弹窗相关变量 ---
const dialogVisible = ref(false) // 控制弹窗显示/隐藏
const publishForm = ref({
  publisherId: myUserId, // 发布者ID
  title: '',
  description: '',
  reward: 10,
  difficulty: 1,
  minRealm: 1
})

// 1. 查询任务列表
const loadData = async () => {
  loading.value = true
  try {
    // 调用我们在 api/mission.js 里写的接口
    const list = await getMissionList({status: 0})
    tableData.value = list // 把后端返回的 List 赋值给表格变量
  } finally {
    loading.value = false
  }
}

// 2. 点击“发布悬赏”按钮
const openPublishDialog = () => {
  // 重置表单数据
  publishForm.value = {
    publisherId: myUserId,
    title: '',
    description: '',
    reward: 10,
    difficulty: 1
  }
  dialogVisible.value = true
}

// 3. 提交发布
const submitPublish = async () => {
  // 简单校验
  if (!publishForm.value.title) {
    ElMessage.warning('请输入任务标题')
    return
  }

  try {
    // 调用后端接口
    await publishMission(publishForm.value)
    ElMessage.success('发布成功！等候道友接单吧！')
    dialogVisible.value = false // 关闭弹窗
    loadData() // 刷新列表
  } catch (error) {
    // 错误处理交给 request.js 了
  }
}

// 4. 抢单
const handleAccept = async (missionId) => {
  try {
    await acceptMission({missionId: missionId, acceptorId: myUserId})
    ElMessage.success('抢单成功！道友手速惊人！')
    loadData() // 抢完单，刷新列表
  } catch (error) {
    console.error(error)
  }
}

// --- 生命周期区 (类似 @PostConstruct) ---
onMounted(() => {
  // 页面一加载，就去查数据
  loadData()
})
</script>

<style scoped>
/* 简单的样式美化 */
.mission-hall {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto; /* 居中 */
  background-color: white;
  min-height: 80vh;
}

.header {
  display: flex;
  justify-content: space-between; /* 标题在左，按钮在右 */
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
</style>