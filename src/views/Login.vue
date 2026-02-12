<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 style="text-align: center">🔮 灵务阁 - 弟子登入</h2>
      </template>

      <div style="margin-bottom: 20px">
        <el-alert title="测试模式：直接输入用户ID即可 (推荐 1 或 2)" type="info" :closable="false" />
      </div>

      <el-form>
        <el-form-item label="弟子令牌 (ID)">
          <el-input-number v-model="userId" :min="1" style="width: 100%" />
        </el-form-item>

        <el-button type="primary" style="width: 100%" @click="handleLogin" size="large">
          进入宗门
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const userId = ref(1) // 默认填1
const router = useRouter()

const handleLogin = () => {
  // 1. 把用户ID存到浏览器缓存里 (localStorage)
  localStorage.setItem('lwg_user_id', userId.value)

  // 2. 提示并跳转
  ElMessage.success(`欢迎归来，ID为 ${userId.value} 的道友！`)
  router.push('/mission-hall')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2c3e50;
}
.login-card {
  width: 400px;
}
</style>