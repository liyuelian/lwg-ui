import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rm, readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @fontsource 的 CSS 在每个 @font-face 里同时声明 woff2 与 woff 两个 src。
 * 本项目只面向支持 woff2 的浏览器（不支持时由 --lwg-font-display 的系统衬线兜底），
 * 因此把 woff 回退从 src 中摘除：否则 dist 里会多出一倍完全无用的字体文件。
 *
 * 注意：必须挂在 generateBundle 上。@fontsource 的 CSS 是被 style.css 的
 * @import 内联进同一个模块的，transform 钩子拿不到它单独的模块记录。
 */
function dropWoffFallback() {
  // 形如 url(./files/x.woff2) format("woff2"),url(./files/x.woff) format("woff")
  // 打包压缩后引号会统一成双引号，故两种引号都要兼容
  const strip = (css) => css.replace(/,\s*url\([^)]*\.woff\)\s*format\(["']woff["']\)/g, '')
  let outDir = join(process.cwd(), 'dist')
  return {
    name: 'lwg-drop-woff-fallback',
    apply: 'build',
    enforce: 'post',
    // 用 Vite 解析后的 root 定位产物目录，不依赖启动构建时的 cwd
    // （Dockerfile 里是 `WORKDIR /build` 后执行 npm run build，本地与 CI 均一致）
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue
        const css = typeof file.source === 'string' ? file.source : file.source.toString()
        const next = strip(css)
        if (next !== css) file.source = next
      }
    },
    // 字体资源在 CSS 打包阶段就已进入产物列表，上面的替换只能清掉引用，
    // 走不到这一步的 .woff 仍会被写到产物目录。这里把没有引用的 .woff 删掉。
    async closeBundle() {
      const assetsDir = join(outDir, 'assets')
      const siblings = await readdir(assetsDir).catch(() => [])
      await Promise.all(
        siblings
          .filter((f) => f.endsWith('.woff'))
          .map((f) => rm(join(assetsDir, f), { force: true }))
      )
    }
  }
}

// 后端地址：dev 与 preview 共用
const API_TARGET = 'http://localhost:8080'
const apiProxy = {
  // 关键配置：把 /api 的请求转发给后端
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
    // rewrite: (path) => path.replace(/^\/api/, '')
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [dropWoffFallback(), vue()],
  server: {
    port: 5173, // 指定前端端口
    proxy: apiProxy
  },
  // preview 也要代理：npm run preview 用于验证 dist 真实产物，
  // 而 vite preview 没有 --proxy 命令行参数，只能在这里配。
  preview: {
    port: 4173,
    proxy: apiProxy
  }
})
