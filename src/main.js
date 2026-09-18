import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
// Element Plus 自带中文包：不设的话分页会显示 "Total 1"、日期选择器为英文
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// ⚠️ 顺序要紧：Element Plus 自带样式先加载，本项目 token 后加载。
// 两者对 :root 的 --el-* 变量是同优先级（都是 :root），靠源码顺序决胜；
// 若把 style.css 放在前面，Element 的默认蓝 #409eff 会盖掉朱砂覆盖。
import 'element-plus/dist/index.css'
import './style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')