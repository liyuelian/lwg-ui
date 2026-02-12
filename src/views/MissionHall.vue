<template>
  <div class="mission-hall">
    <div class="header">
      <h2>📜 灵务阁 - 任务大厅</h2>
      <el-button type="primary" size="large" @click="handlePublish">
        + 发布悬赏
      </el-button>
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
          <el-tag v-else-if="scope.row.difficulty === 2" type="warning">困难</el-tag>
          <el-tag v-else type="danger">地狱</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <el-button
              type="primary"
              size="small"
              @click="handleAccept(scope.row.id)"
          >
            抢单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {getMissionList, acceptMission} from '../api/mission'
import {ElMessage} from 'element-plus'

// --- 变量定义区  ---
const loading = ref(false)   // 加载状态
const tableData = ref([])    // 表格数据 (List<Mission>)
const myUserId = 2           // 后续更改

// --- 方法定义区 ---

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

// 2. 抢单按钮点击
const handleAccept = async (missionId) => {
  try {
    await acceptMission({missionId: missionId, acceptorId: myUserId})
    ElMessage.success('抢单成功！道友手速惊人！')
    loadData() // 抢完单，刷新列表
  } catch (error) {
    // 错误已经在 request.js 里弹窗了，这里不用处理
  }
}

// 3. 发布按钮点击
const handlePublish = () => {
  ElMessage.info('发布功能开发中...')
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