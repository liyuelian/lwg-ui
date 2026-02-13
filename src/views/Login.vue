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

<style>
/* 强制去白边 */
html, body, #app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f4f6f8; /* 改用更护眼的冷灰调，减少发黄的疲劳感 */
}
</style>

<style scoped>
/* 引入更易读的思源宋体（标题用） */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

/* 外层容器 */
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5; /* 类似 AntDesign 的护眼灰 */
  /* 正文改用系统黑体：这是最护眼的方案 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #333;
}

/* 卡片 */
.login-card {
  width: 380px;
  background-color: #fff;
  padding: 50px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* 阴影稍微加深一点，增强层次感 */
  border-radius: 8px; /* 圆角加大，视觉更柔和 */
}

/* 标题区 */
.header { text-align: center; margin-bottom: 35px; }

.title {
  /* 仅标题保留宋体，保留韵味 */
  font-family: 'Noto Serif SC', serif;
  font-size: 32px;
  font-weight: 700; /* 加粗！细字体太费眼 */
  margin: 0 0 8px 0;
  letter-spacing: 4px; /* 间距缩小，不再那么散 */
  color: #1a1a1a; /* 纯黑太刺眼，用深灰 */
}

.subtitle {
  font-size: 14px;
  color: #666; /* 降低对比度 */
  letter-spacing: 1px;
  margin: 0;
  font-weight: 400;
}

/* 提示条 */
.notification {
  background-color: #eef2f7; /* 蓝灰色底，比纯灰舒服 */
  padding: 10px 16px;
  font-size: 13px;
  color: #4a5568;
  border-radius: 4px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}
.dot {
  width: 6px; height: 6px; background: #8b3a3a; border-radius: 50%; margin-right: 8px;
}

/* 输入框 */
.form-group { margin-bottom: 40px; }
.input-label {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 500; /* 稍微加粗 */
  margin-bottom: 12px;
}

.input-wrapper {
  background: #f9f9f9; /* 给输入框加个底色，不再是只有一条线，点击区域更清晰 */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 12px;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #8b3a3a;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(139, 58, 58, 0.1);
}

.minimal-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px; /* 字体加大 */
  font-family: inherit; /* 继承黑体 */
  color: #1a1a1a;
  background: transparent;
  padding: 12px 0;
  text-align: left; /* 回归左对齐，符合阅读习惯 */
}
/* 隐藏箭头 */
.minimal-input::-webkit-outer-spin-button,
.minimal-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* 按钮 */
.submit-btn {
  width: 100%;
  height: 48px;
  background-color: #8b3a3a;
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px; /* 适度间距 */
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}
.submit-btn:hover { background-color: #a64d40; }
.submit-btn:disabled { background-color: #dcdcdc; cursor: not-allowed; }

/* 底部 */
.footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
</style>