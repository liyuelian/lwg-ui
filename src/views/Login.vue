<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <span class="seal" aria-hidden="true">灵</span>
        <h1 class="login__title">灵 务 阁</h1>
        <p class="login__sub">凡有所求 · 皆可悬赏</p>
      </div>

      <!-- 说明条：不再自称"测试模式"。
           后端 UserController.login 立项后，此处替换为真正的账号密码 / 令牌登录。 -->
      <p class="notice">
        <span class="notice__dot" aria-hidden="true"></span>
        凭弟子令牌入阁。令牌由宗门执事发授，即你的道友编号。
      </p>

      <form class="login__form" @submit.prevent="handleLogin">
        <label class="field">
          <span class="field__label">弟子令牌</span>
          <span class="field__box" :class="{ 'is-error': errorText }">
            <input
                v-model="userId"
                type="text"
                inputmode="numeric"
                autocomplete="username"
                class="field__input"
                placeholder="请输入令牌编号"
                @input="errorText = ''"
            />
          </span>
          <span v-if="errorText" class="field__error" role="alert">{{ errorText }}</span>
        </label>

        <button class="lwg-btn lwg-btn--primary login__submit" type="submit" :disabled="loading">
          {{ loading ? '正在通传…' : '开 启 灵 识' }}
        </button>
      </form>

      <p class="login__foot">© {{ year }} 灵务阁 · 心诚则灵</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const userId = ref('')
const loading = ref(false)
const errorText = ref('')
const router = useRouter()
const year = new Date().getFullYear()

const handleLogin = () => {
  const raw = String(userId.value ?? '').trim()
  if (!raw) {
    errorText.value = '请出示令牌'
    return
  }
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    errorText.value = '令牌应为正整数编号'
    return
  }

  errorText.value = ''
  loading.value = true
  // 暂无后端登录接口，本地留存令牌后入阁；将来在此换成 login 接口 + token
  setTimeout(() => {
    localStorage.setItem('lwg_user_id', Number(raw))
    loading.value = false
    router.push('/mission-hall')
  }, 500)
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--lwg-sp-5) var(--lwg-sp-4);
  background-color: var(--lwg-paper);
  /* 宣纸肌理：两层极淡的斜向墨痕，不引图片 */
  background-image:
    repeating-linear-gradient(115deg, rgba(43, 43, 43, .014) 0 2px, transparent 2px 9px),
    repeating-linear-gradient(28deg, rgba(139, 58, 58, .012) 0 1px, transparent 1px 12px);
}

.login__card {
  width: 100%;
  max-width: 400px;
  background: var(--lwg-paper-3);
  border: 1px solid var(--lwg-line);
  border-top: 2px solid var(--lwg-cinnabar);
  border-radius: var(--lwg-radius);
  box-shadow: var(--lwg-shadow-float);
  padding: var(--lwg-sp-7) var(--lwg-sp-6) var(--lwg-sp-6);
}

/* ---------- 品牌 ---------- */
.login__brand { text-align: center; margin-bottom: var(--lwg-sp-5); }
.seal {
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: var(--lwg-sp-3);
  background: var(--lwg-cinnabar);
  color: var(--lwg-on-accent);
  font-family: var(--lwg-font-display);
  font-size: 26px;
  border-radius: var(--lwg-radius);
  transform: rotate(-4deg);
}
.login__title {
  font-family: var(--lwg-font-display);
  font-size: var(--lwg-fs-2xl);
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--lwg-ink);
  margin: 0 0 var(--lwg-sp-2);
}
.login__sub {
  font-size: var(--lwg-fs-sm);
  color: var(--lwg-ink-3);
  letter-spacing: 2px;
  margin: 0;
}

/* ---------- 说明条 ---------- */
.notice {
  display: flex;
  align-items: flex-start;
  gap: var(--lwg-sp-2);
  margin: 0 0 var(--lwg-sp-5);
  padding: 10px var(--lwg-sp-3);
  background: var(--lwg-cinnabar-wash);
  border: 1px solid var(--lwg-line);
  border-left: 3px solid var(--lwg-cinnabar);
  border-radius: var(--lwg-radius);
  font-size: var(--lwg-fs-sm);
  line-height: 1.7;
  color: var(--lwg-ink-2);
}
.notice__dot {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--lwg-cinnabar);
}

/* ---------- 表单 ---------- */
.field { display: block; margin-bottom: var(--lwg-sp-5); }
.field__label {
  display: block;
  font-size: var(--lwg-fs-sm);
  color: var(--lwg-ink-2);
  margin-bottom: var(--lwg-sp-2);
  letter-spacing: 1px;
}
.field__box {
  display: block;
  border: 1px solid var(--lwg-line);
  border-bottom: 1px solid var(--lwg-line-strong);
  border-radius: var(--lwg-radius);
  background: var(--lwg-paper);
  padding: 0 var(--lwg-sp-3);
  transition: border-color .18s ease, background-color .18s ease;
}
.field__box:focus-within {
  border-color: var(--lwg-cinnabar);
  background: var(--lwg-paper-3);
}
.field__box.is-error { border-color: var(--lwg-danger); }
.field__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 13px 0;
  font-family: var(--lwg-font-mono);
  font-size: var(--lwg-fs-md);
  letter-spacing: 1px;
  color: var(--lwg-ink);
}
.field__input::placeholder { color: var(--lwg-ink-3); font-family: var(--lwg-font-body); }
.field__error {
  display: block;
  margin-top: 6px;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-danger);
}

.login__submit {
  width: 100%;
  height: 46px;
  font-size: var(--lwg-fs-md);
  letter-spacing: 3px;
}

.login__foot {
  margin: var(--lwg-sp-6) 0 0;
  text-align: center;
  font-size: var(--lwg-fs-xs);
  color: var(--lwg-ink-3);
  letter-spacing: 1px;
}

@media (max-width: 640px) {
  .login__card { padding: var(--lwg-sp-6) var(--lwg-sp-4) var(--lwg-sp-5); }
  .login__title { font-size: var(--lwg-fs-xl); letter-spacing: 3px; }
}
</style>
