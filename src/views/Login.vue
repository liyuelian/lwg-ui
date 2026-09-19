<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1 class="title">灵 务 阁</h1>
        <p class="subtitle">天地不仁 · 以万物为刍狗</p>
      </div>

      <div class="notification">
        <span class="dot"></span> 凡人测试模式：请输入 1 或 2
      </div>

      <div class="form-group">
        <label class="input-label">弟子令牌 (UID)</label>
        <div class="input-wrapper">
          <input
              v-model="userId"
              type="number"
              class="minimal-input"
              placeholder="请输入数字 ID"
              @keyup.enter="handleLogin"
          />
        </div>
      </div>

      <button class="submit-btn" @click="handleLogin" :disabled="loading">
        {{ loading ? '正在连接...' : '开 启 灵 识' }}
      </button>

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
  if (!userId.value) {
    ElMessage.warning('请出示令牌')
    return
  }
  loading.value = true
  setTimeout(() => {
    localStorage.setItem('lwg_user_id', userId.value)
    router.push('/mission-hall')
    loading.value = false
  }, 800)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

/* 让这个容器自己去撑满屏幕，而不是去改 body */
.login-container {
  position: fixed; /* 强制覆盖全屏 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  z-index: 999;
}

/* 下面的样式保持不变 */
.login-card {
  width: 380px;
  background-color: #fff;
  padding: 50px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.header { text-align: center; margin-bottom: 35px; }
.title {
  font-family: 'Noto Serif SC', serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 4px;
  color: #1a1a1a;
}
.subtitle { font-size: 14px; color: #666; letter-spacing: 1px; margin: 0; font-weight: 400; }

.notification {
  background-color: #eef2f7;
  padding: 10px 16px;
  font-size: 13px;
  color: #4a5568;
  border-radius: 4px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}
.dot { width: 6px; height: 6px; background: #8b3a3a; border-radius: 50%; margin-right: 8px; }

.form-group { margin-bottom: 40px; }
.input-label { display: block; font-size: 14px; color: #333; font-weight: 500; margin-bottom: 12px; }
.input-wrapper {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 12px;
  transition: all 0.3s;
}
.input-wrapper:focus-within { border-color: #8b3a3a; background: #fff; box-shadow: 0 0 0 2px rgba(139, 58, 58, 0.1); }

.minimal-input {
  width: 100%; border: none; outline: none; font-size: 16px; font-family: inherit;
  color: #1a1a1a; background: transparent; padding: 12px 0; text-align: left;
}
.minimal-input::-webkit-outer-spin-button, .minimal-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.submit-btn {
  width: 100%; height: 48px; background-color: #8b3a3a; color: #fff; border: none;
  font-size: 16px; font-weight: 500; letter-spacing: 2px; cursor: pointer;
  transition: all 0.2s; border-radius: 4px;
}
.submit-btn:hover { background-color: #a64d40; }
.submit-btn:disabled { background-color: #dcdcdc; cursor: not-allowed; }

.footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
</style>