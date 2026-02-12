<template>
  <div class="login-container">
    <div class="login-box">
      <div class="header">
        <h1 class="title">灵 务 阁</h1>
        <p class="subtitle">天地不仁 · 以万物为刍狗</p>
      </div>

      <el-form class="login-form">
        <div class="tips-box">
          凡人测试模式：请输入 1 或 2
        </div>

        <el-form-item>
          <div class="input-label">弟子令牌 (UID)</div>
          <el-input-number
              v-model="userId"
              :min="1"
              controls-position="right"
              size="large"
          />
        </el-form-item>

        <el-button
            class="submit-btn"
            @click="handleLogin"
            :loading="loading"
        >
          {{ loading ? '结印中...' : '开 启 灵 识' }}
        </el-button>
      </el-form>

      <div class="footer">
        © 2026 灵务阁 · 只有后端也能飞升
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const userId = ref(1)
const loading = ref(false)
const router = useRouter()

const handleLogin = () => {
  loading.value = true

  setTimeout(() => {
    localStorage.setItem('lwg_user_id', userId.value)

    ElMessage({
      message: `道友 (ID:${userId.value}) 归位。`,
      type: 'success',
      plain: true,
    })

    router.push('/mission-hall')
    loading.value = false
  }, 600)
}
</script>

<style scoped>

/* ===== 全局去白边（重要）===== */
:global(html, body, #app) {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #f6f3ee;
}


/* ===== 页面背景：宣纸感 ===== */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f6f3ee;
  font-family: "STSong", "SimSun", serif;
  color: #1f1f1f;
  position: relative;
}

/* 淡水墨晕染 */
.login-container::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0,0,0,0.05), transparent 70%);
  top: 15%;
  left: 10%;
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
}


/* ===== 主体盒子：极简白卡 ===== */
.login-box {
  width: 420px;
  padding: 70px 55px;
  background: #ffffff;
  border: 1px solid #e6e2dc;
}

/* ===== 标题区 ===== */
.header {
  text-align: center;
  margin-bottom: 50px;
}

.title {
  font-size: 34px;
  letter-spacing: 14px;
  font-weight: normal;
  margin: 0;
}

.subtitle {
  margin-top: 14px;
  font-size: 14px;
  color: #6b6b6b;
}


/* ===== 提示 ===== */
.tips-box {
  background: #faf8f4;
  border-left: 3px solid #8c3b2f;
  padding: 12px 14px;
  font-size: 13px;
  color: #444;
  margin-bottom: 35px;
}


/* ===== 输入 ===== */
.input-label {
  font-size: 14px;
  margin-bottom: 10px;
  color: #333;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  border-bottom: 1px solid #cfcac3;
  border-radius: 0;
}

:deep(.el-input__inner) {
  font-size: 18px;
  font-family: "STSong", serif;
  color: #1f1f1f;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: transparent !important;
  border: none !important;
  color: #888 !important;
}


/* ===== 按钮：朱砂印章感 ===== */
.submit-btn {
  width: 100%;
  margin-top: 45px;
  background: #8c3b2f;
  border: none;
  color: white;
  height: 44px;
  font-size: 15px;
  letter-spacing: 6px;
  transition: background 0.2s ease;
}

.submit-btn:hover {
  background: #6f2d23;
}


/* ===== 底部 ===== */
.footer {
  margin-top: 60px;
  font-size: 12px;
  text-align: center;
  color: #aaa;
}

</style>
