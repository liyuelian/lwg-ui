#!/usr/bin/env node
/**
 * 灵务阁前端 · 本地自测脚本（CDP 驱动真实浏览器）
 * ============================================================================
 * 依据 docs/frontend-redesign.md 第 8 节的验收清单，用真实 Chrome 跑一遍界面，
 * 而不是只做静态检查。零第三方依赖：只用 Node 内置 WebSocket（Node >= 22）
 * 和本机已装的 Chrome。
 *
 * 用法：
 *   # 1) 起后端与前端（dev 或 dist 产物皆可）
 *   npm run dev
 *   # 2) 另开终端跑自测
 *   node scripts/verify-ui.mjs
 *   BASE_URL=http://localhost:4173 node scripts/verify-ui.mjs   # 验 dist 产物
 *
 * 产物：artifacts/verify/*.png（截图）、artifacts/verify/report.json（逐条断言）
 * 退出码：0 = 全部通过，1 = 有失败项，2 = 环境不可用
 *
 * 前置数据：需要一个「招募中」且「非本人发布」的任务来验证接榜反馈。
 * 脚本会自行以道友 #2 的身份操作，用后端业务校验（境界不足）构造可预期失败，
 * 不修改任何数据。
 */

import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'artifacts', 'verify')
const PROFILE = join(ROOT, 'artifacts', 'chrome-profile')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const PORT = Number(process.env.CDP_PORT || 9336)
const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
rmSync(PROFILE, { recursive: true, force: true })
mkdirSync(join(PROFILE, 'tmp'), { recursive: true })

const results = []
const consoleErrors = []
const netRequests = []
const record = (id, ok, detail) => {
  results.push({ id, ok, detail })
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${id} — ${detail}`)
}

/* ------------------------------------------------------------------ */
/* 启动浏览器                                                          */
/* ------------------------------------------------------------------ */
// 预检：调试端口被占用时立即给出可操作的提示。
// 否则本脚本会连上**上一个残留的 Chrome 实例**，收不到响应而卡到超时，
// 报出的却是 undici 的 UND_ERR_HEADERS_TIMEOUT，极难定位。
try {
  const probe = await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(1500) })
  if (probe.ok) {
    const stale = await probe.json().catch(() => ({}))
    console.error(
      `\n✗ 调试端口 ${PORT} 已被占用（${stale.Browser || '未知浏览器'} 仍在运行）。\n` +
      `  很可能是上一次自测残留的 Chrome。请先结束它，或换端口：\n` +
      `      CDP_PORT=9400 npm run verify:ui\n` +
      `  强制结束：pkill -f 'remote-debugging-port=${PORT}'\n`
    )
    process.exit(2)
  }
} catch { /* 端口空闲，正常 */ }

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--no-sandbox',
  '--disable-breakpad', '--disable-crash-reporter',
  '--use-mock-keychain', '--password-store=basic',
  '--window-size=1440,960',
  'about:blank'
], { stdio: 'ignore', detached: true, env: { ...process.env, TMPDIR: join(PROFILE, 'tmp') } })

const killChrome = () => {
  try { process.kill(-chrome.pid, 'SIGKILL') } catch { try { chrome.kill('SIGKILL') } catch {} }
}
process.on('exit', killChrome)
process.on('SIGINT', () => { killChrome(); process.exit(130) })

let version = null
for (let i = 0; i < 150; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    if (r.ok) { version = await r.json(); break }
  } catch { /* 未就绪 */ }
  await sleep(150)
}
if (!version) {
  console.error(`\n✗ 无法连接 Chrome（${CHROME}）。可用 CHROME_PATH 指定路径。\n`)
  killChrome()
  process.exit(2)
}

// 前置检查：前端与后端必须可达，否则断言结果没有意义
for (const [name, url] of [['前端', BASE], ['后端', 'http://localhost:8080/api/user/info?userId=1']]) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    console.error(`\n✗ ${name}不可达（${url}）：${e.message}\n  请先起后端（docker compose up -d）与前端（npm run dev）。\n`)
    killChrome()
    process.exit(2)
  }
}

console.log(`\nChrome: ${version.Browser}`)
console.log(`目标:   ${BASE}\n`)

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()

/* ------------------------------------------------------------------ */
/* 极简 CDP 客户端                                                      */
/* ------------------------------------------------------------------ */
class CDP {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.id = 0
    this.pending = new Map()
    this.handlers = new Map()
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', res)
      this.ws.addEventListener('error', rej)
    })
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      } else if (msg.method) {
        ;(this.handlers.get(msg.method) || []).forEach((fn) => fn(msg.params))
      }
    })
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, [])
    this.handlers.get(method).push(fn)
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP 超时: ${method}`)) }
      }, 30000)
    })
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true, userGesture: true
    })
    if (r.exceptionDetails) {
      throw new Error(`页面内异常: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`)
    }
    return r.result.value
  }
}

const cdp = new CDP(tab.webSocketDebuggerUrl)
await cdp.ready

cdp.on('Runtime.consoleAPICalled', (p) => {
  if (p.type === 'error') {
    consoleErrors.push('console.error: ' + p.args.map((a) => a.value ?? a.description ?? a.type).join(' '))
  }
})
cdp.on('Runtime.exceptionThrown', (p) => {
  const d = p.exceptionDetails
  consoleErrors.push('uncaught: ' + (d.exception?.description || d.text))
})
cdp.on('Log.entryAdded', (p) => {
  if (p.entry.level === 'error') consoleErrors.push(`log: ${p.entry.text} ${p.entry.url || ''}`)
})
cdp.on('Network.requestWillBeSent', (p) => netRequests.push(p.request.url))

for (const m of ['Runtime.enable', 'Log.enable', 'Network.enable', 'Page.enable', 'DOM.enable']) {
  await cdp.send(m)
}

/* ------------------------------------------------------------------ */
/* 工具                                                               */
/* ------------------------------------------------------------------ */
async function goto(path, waitMs = 1400) {
  await cdp.send('Page.navigate', { url: `${BASE}${path}` })
  await sleep(waitMs)
  await cdp.eval(`document.fonts.ready.then(() => true)`).catch(() => {})
}
async function setViewport(width, height, mobile = false) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  await sleep(350)
}
async function shot(name) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, 'base64'))
}

const OVERFLOW = `(() => {
  const de = document.documentElement;
  const over = de.scrollWidth - de.clientWidth;
  const bad = [];
  if (over > 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > de.clientWidth + 1) {
        bad.push(el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] + '@' + Math.round(r.right));
      }
      if (bad.length > 5) break;
    }
  }
  return { over, bad };
})()`

async function checkNoHScroll(label) {
  const r = await cdp.eval(OVERFLOW)
  record('AC5', r.over <= 1, `${label}：横向溢出 ${r.over}px${r.bad.length ? '，越界元素 ' + r.bad.join(', ') : ''}`)
}

/** 失败注入：让匹配的请求返回业务错误，用于验证就地反馈。fetch 与 XHR 两条链路都拦。 */
const installMock = (urlPart, msg) => cdp.eval(`(() => {
  window.__mockHits = [];
  const body = JSON.stringify({ code: 500, msg: ${JSON.stringify(msg)}, data: null });
  const match = (u) => String(u || '').includes(${JSON.stringify(urlPart)});
  if (!window.__origFetch) window.__origFetch = window.fetch;
  window.fetch = function (input) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (match(url)) {
      window.__mockHits.push('fetch:' + url);
      return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return window.__origFetch.apply(this, arguments);
  };
  if (!window.__origOpen) {
    window.__origOpen = XMLHttpRequest.prototype.open;
    window.__origSend = XMLHttpRequest.prototype.send;
  }
  XMLHttpRequest.prototype.open = function (m, u, ...rest) { this.__url = u; return window.__origOpen.call(this, m, u, ...rest); };
  XMLHttpRequest.prototype.send = function (...args) {
    if (match(this.__url)) {
      window.__mockHits.push('xhr:' + this.__url);
      const self = this;
      setTimeout(() => {
        for (const [k, v] of [['status', 200], ['readyState', 4], ['responseText', body], ['response', body]]) {
          Object.defineProperty(self, k, { value: v, configurable: true });
        }
        self.getAllResponseHeaders = () => 'content-type: application/json';
        for (const e of ['readystatechange', 'load', 'loadend']) self.dispatchEvent(new Event(e));
      }, 200);
      return;
    }
    return window.__origSend.apply(this, args);
  };
  return true;
})()`)

/* ================================================================== */
/* 断言开始                                                            */
/* ================================================================== */
console.log('--- 登录页 ---')
await goto('/login')
await cdp.eval('localStorage.clear()')
await goto('/login')

/* AC4 标题 / lang / favicon */
{
  const t = await cdp.eval('document.title')
  const lang = await cdp.eval('document.documentElement.lang')
  const icon = await cdp.eval(`document.querySelector('link[rel="icon"]')?.getAttribute('href') || ''`)
  record('AC4', t === '灵务阁' && lang === 'zh-CN', `title="${t}" lang="${lang}" favicon="${icon}"`)
}

/* 登录流程：真实键盘输入 */
{
  await cdp.eval(`document.querySelector('.field__input').focus()`)
  await cdp.send('Input.insertText', { text: '1' })
  await sleep(200)
  const typed = await cdp.eval(`document.querySelector('.field__input').value`)
  const testCopy = await cdp.eval(`document.body.innerText.includes('凡人测试模式')`)
  record('LOGIN', typed === '1' && !testCopy, `输入="${typed}"，测试文案残留=${testCopy}`)
  await cdp.eval(`document.querySelector('.login__submit').click()`)
  await sleep(1300)
  const path = await cdp.eval('location.pathname')
  record('LOGIN', path === '/mission-hall', `提交后路径 ${path}`)
}

/* AC1 字体 / AC2 底色 */
{
  const gf = netRequests.filter((u) => /fonts\.googleapis|fonts\.gstatic/.test(u))
  const woff2 = netRequests.filter((u) => /\.woff2(\?|$)/.test(u))
  const loaded = await cdp.eval(`(async () => {
    await document.fonts.load('700 28px "Noto Serif SC"', '任务大厅天道碑');
    await document.fonts.ready;
    return document.fonts.check('700 28px "Noto Serif SC"', '任务大厅');
  })()`)
  const tf = await cdp.eval(`(() => {
    const cs = getComputedStyle(document.querySelector('.lwg-page-title'));
    return { family: cs.fontFamily.split(',')[0], weight: cs.fontWeight, size: cs.fontSize, ls: cs.letterSpacing };
  })()`)
  record('AC1', gf.length === 0 && loaded && woff2.length > 0,
    `Google Fonts 请求 ${gf.length} 条；本地 woff2 ${woff2.length} 个；Noto Serif SC 已加载=${loaded}；标题=${tf.family} ${tf.weight} ${tf.size} 字距=${tf.ls}`)

  const bodyBg = await cdp.eval(`getComputedStyle(document.body).backgroundColor`)
  record('AC2', bodyBg === 'rgb(245, 240, 230)', `body 背景 ${bodyBg}（宣纸 #f5f0e6）`)
}

/* 任务大厅渲染 + 状态文案对齐 */
{
  const info = await cdp.eval(`(() => ({
    layout: document.querySelector('.el-table') ? 'table' : 'cards',
    rows: document.querySelectorAll('.el-table__body tbody tr').length,
    pager: !!document.querySelector('.el-pagination'),
    pagerText: (document.querySelector('.el-pagination')||{}).innerText?.replace(/\\n/g,' ') || '',
    statuses: [...new Set([...document.querySelectorAll('.lwg-status')].map(e => e.textContent.trim()))]
  }))()`)
  record('HALL', info.rows > 0 && info.pager,
    `1440px 布局=${info.layout} 行数=${info.rows} 分页="${info.pagerText}" 状态=${JSON.stringify(info.statuses)}`)
  // 分页文案必须是中文（Element 默认英文会显示 Total）
  record('HALL', !/Total/i.test(info.pagerText), `分页为中文：${JSON.stringify(info.pagerText)}`)

  const legacy = await cdp.eval(`(() => {
    const t = document.body.innerText;
    return { xiuxian: t.includes('修仙中'), daijiesuan: t.includes('待结算') };
  })()`)
  record('AC2', !legacy.xiuxian && !legacy.daijiesuan,
    `旧状态文案残留：修仙中=${legacy.xiuxian} 待结算=${legacy.daijiesuan}`)
}
await shot('01-hall-1440')
await checkNoHScroll('1440px 任务大厅')

/* AC5 断点 */
await setViewport(768, 900)
{
  const info = await cdp.eval(`(() => ({
    layout: document.querySelector('.el-table') ? 'table' : 'cards',
    cards: document.querySelectorAll('.mission-card').length,
    burger: getComputedStyle(document.querySelector('.burger')).display
  }))()`)
  record('AC5', info.layout === 'cards' && info.burger !== 'none',
    `768px 布局=${info.layout} 卡片=${info.cards} 汉堡=${info.burger}`)
}
await checkNoHScroll('768px 任务大厅')
await shot('02-hall-768')

await setViewport(375, 812, true)
await checkNoHScroll('375px 任务大厅')
{
  await cdp.eval(`document.querySelector('.burger').click()`)
  await sleep(300)
  const r = await cdp.eval(`(() => {
    const d = document.querySelector('.drawer__panel');
    return {
      expanded: document.querySelector('.burger').getAttribute('aria-expanded'),
      display: d ? getComputedStyle(d).display : 'missing',
      items: [...document.querySelectorAll('.drawer__item')].map(e => e.textContent.trim())
    };
  })()`)
  record('NAV', r.expanded === 'true' && r.display !== 'none',
    `汉堡展开=${r.expanded} 抽屉=${r.display} 项=${JSON.stringify(r.items)}`)
  await shot('03-hall-375-menu')
  await cdp.eval(`document.querySelector('.burger').click()`)
  await sleep(250)
}

/* AC8 接榜失败就地反馈。
   本库「招募中」只有道友 #1 发布的任务，改用道友 #2（境界 5 < minRealm 9）
   触发后端真实校验拒绝：可预期失败且不产生任何数据变更。 */
await setViewport(1440, 960)
{
  await goto('/login', 900)
  await cdp.eval(`localStorage.setItem('lwg_user_id','2')`)
  await goto('/mission-hall', 2000)

  const pre = await cdp.eval(`(() => {
    const tr = [...document.querySelectorAll('.el-table__body tbody tr')][0];
    if (!tr) return null;
    return { id: tr.querySelector('td')?.innerText.trim(), labels: [...tr.querySelectorAll('.lwg-btn')].map(b => b.textContent.trim()) };
  })()`)

  if (!pre || !pre.labels.includes('接榜')) {
    record('AC8', false, `道友 #2 视角下未出现「接榜」按钮：${JSON.stringify(pre)}`)
  } else {
    await cdp.eval(`(() => {
      for (const tr of document.querySelectorAll('.el-table__body tbody tr')) {
        const b = [...tr.querySelectorAll('.lwg-btn')].find(x => x.textContent.trim() === '接榜');
        if (b) { b.click(); return true; }
      }
      return false;
    })()`)
    await sleep(1600)
    const real = await cdp.eval(`(() => ({
      toasts: [...document.querySelectorAll('.el-message')].map(e => e.innerText.trim()),
      inline: [...document.querySelectorAll('.lwg-inline-error')].map(e => e.innerText.trim()),
      status: document.querySelector('.el-table__body tbody tr .lwg-status')?.textContent.trim()
    }))()`)
    record('AC8', real.inline.length > 0 && real.toasts.length === 0,
      `真实后端拒绝：就地提示=${JSON.stringify(real.inline)}；toast=${JSON.stringify(real.toasts)}；状态仍为「${real.status}」`)
    await shot('04-hall-inline-error')

    await sleep(1600)
    const gone = await cdp.eval(`document.querySelectorAll('.lwg-inline-error').length`)
    record('AC8', gone === 0, `约 2s 后就地提示自动消失（剩余 ${gone} 条）`)

    // 注入路径：业务码非 200
    await installMock('/mission/accept', '该榜文已被其他道友接下')
    await cdp.eval(`(() => {
      for (const tr of document.querySelectorAll('.el-table__body tbody tr')) {
        const b = [...tr.querySelectorAll('.lwg-btn')].find(x => x.textContent.trim() === '接榜');
        if (b) { b.click(); return true; }
      }
      return false;
    })()`)
    await sleep(1200)
    const inj = await cdp.eval(`(() => ({
      hits: window.__mockHits.length,
      inline: [...document.querySelectorAll('.lwg-inline-error')].map(e => e.innerText.trim()),
      toasts: document.querySelectorAll('.el-message').length
    }))()`)
    record('AC8', inj.hits > 0 && inj.inline.length > 0 && inj.toasts === 0,
      `注入业务错误命中 ${inj.hits} 次：就地提示=${JSON.stringify(inj.inline)}；toast=${inj.toasts}`)
  }
  await cdp.eval(`localStorage.setItem('lwg_user_id','1')`)
}

/* AC7 天道碑暗色作用域 */
await goto('/rank')
{
  const dark = await cdp.eval(`(() => {
    const n = document.querySelector('.lwg-night');
    if (!n) return { error: '.lwg-night 未找到' };
    const cs = getComputedStyle(n);
    return {
      paper: cs.getPropertyValue('--lwg-paper').trim(),
      gold: cs.getPropertyValue('--lwg-gold').trim(),
      glow: cs.getPropertyValue('--lwg-glow').trim(),
      bg: cs.backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      tabCount: document.querySelectorAll('.board-tabs .el-tabs__item').length,
      monthDisabled: !!document.querySelector('.board-tabs .el-tabs__item.is-disabled'),
      mine: (document.querySelector('.mine')||{}).innerText?.replace(/\\n/g,' ').trim() || '',
      boardEmpty: (document.querySelector('.board .lwg-empty')||{}).innerText?.replace(/\\n/g,' ').trim() || ''
    };
  })()`)
  if (dark.error) {
    record('AC7', false, dark.error)
  } else {
    record('AC7', dark.paper === '#12161c' && dark.gold === '#d4af6a',
      `碑面 --lwg-paper=${dark.paper} --lwg-gold=${dark.gold} 底色=${dark.bg}`)
    record('AC7', dark.bodyBg === 'rgb(245, 240, 230)', `暗色未污染 body（${dark.bodyBg}）`)
    record('RANK', dark.tabCount === 3 && dark.monthDisabled,
      `Tab 共 ${dark.tabCount} 个，月榜置灰=${dark.monthDisabled}`)
    record('RANK', !!dark.mine, `我的名次卡片="${dark.mine}"；榜单引导="${dark.boardEmpty.slice(0, 40)}"`)
  }
  await shot('05-rank-night-1440')
}
await setViewport(375, 812, true)
await checkNoHScroll('375px 天道碑')
await shot('06-rank-night-375')
await setViewport(1440, 960)

/* AC6 路由过渡无白屏 + AC7 返回后 class 不残留 */
{
  const r = await cdp.eval(`(async () => {
    const root = document.querySelector('#app');
    const samples = [];
    const t0 = performance.now();
    document.querySelector('.nav__item[href="/mission-hall"]').click();
    return await new Promise((resolve) => {
      const tick = () => {
        const t = performance.now() - t0;
        const ch = root.firstElementChild?.getBoundingClientRect() || { width: 0, height: 0 };
        samples.push({ w: Math.round(ch.width), h: Math.round(ch.height) });
        if (t >= 420) {
          const blank = samples.filter(s => s.w < 10 || s.h < 10);
          resolve({ blank: blank.length, total: samples.length, path: location.pathname });
        } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  })()`)
  record('AC6', r.blank === 0,
    `天道碑 → 任务大厅：采样 ${r.total} 帧，空白帧 ${r.blank}，落点 ${r.path}`)

  await sleep(500)
  const back = await cdp.eval(`(() => ({
    night: !!document.querySelector('.lwg-night'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    paper: getComputedStyle(document.documentElement).getPropertyValue('--lwg-paper').trim()
  }))()`)
  record('AC7', !back.night && back.bodyBg === 'rgb(245, 240, 230)' && back.paper === '#f5f0e6',
    `返回后 .lwg-night 残留=${back.night}；body=${back.bodyBg}；根 --lwg-paper=${back.paper}`)
}

/* AC3 Element 主色：分页 / 步骤条 / MessageBox */
{
  const pager = await cdp.eval(`(() => ({
    primary: getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim(),
    activeBg: (() => { const li = document.querySelector('.el-pagination .el-pager li.is-active'); return li ? getComputedStyle(li).backgroundColor : null })()
  }))()`)
  record('AC3', pager.primary === '#8b3a3a' && pager.activeBg === 'rgb(139, 58, 58)',
    `--el-color-primary=${pager.primary}；分页当前页底色=${pager.activeBg}`)

  await cdp.eval(`(() => {
    for (const tr of document.querySelectorAll('.el-table__body tbody tr')) {
      const b = [...tr.querySelectorAll('.lwg-btn')].find(x => x.textContent.includes('详情'));
      if (b) { b.click(); return true; }
    }
    return false;
  })()`)
  await sleep(900)
  const steps = await cdp.eval(`(() => {
    const t = document.querySelector('.ink-steps .el-step__title.is-finish, .ink-steps .el-step__title.is-success');
    return { present: !!document.querySelector('.ink-steps'), titleColor: t ? getComputedStyle(t).color : null };
  })()`)
  record('AC3', steps.present && steps.titleColor === 'rgb(139, 58, 58)',
    `el-steps 存在=${steps.present} 完成节点标题色=${steps.titleColor}`)
  await shot('07-detail-dialog')

  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('.dialog-footer .lwg-btn')].find(x => x.textContent.includes('关闭'));
    b && b.click(); return true;
  })()`)
  await sleep(500)

  const hasCancel = await cdp.eval(`(() => {
    for (const tr of document.querySelectorAll('.el-table__body tbody tr')) {
      const b = [...tr.querySelectorAll('.lwg-btn')].find(x => x.textContent.trim() === '撤榜');
      if (b) { b.click(); return true; }
    }
    return false;
  })()`)
  await sleep(900)
  if (hasCancel) {
    const box = await cdp.eval(`(() => {
      const el = document.querySelector('.el-message-box');
      if (!el) return { present: false };
      return { present: true, btnBg: getComputedStyle(el.querySelector('.el-button--primary')).backgroundColor };
    })()`)
    record('AC3', box.present && box.btnBg === 'rgb(139, 58, 58)',
      `ElMessageBox 确认键底色=${box.btnBg}（期望朱砂）`)
    await shot('08-messagebox')
    await cdp.eval(`(() => {
      const b = [...document.querySelectorAll('.el-message-box .el-button')].find(x => x.textContent.includes('再想想'));
      b && b.click(); return true;
    })()`)
  } else {
    record('AC3', false, '当前页签没有本人发布的待接单任务，无法触发撤榜 ElMessageBox')
  }
  await sleep(400)
}

/* AC9 图表 resize 解绑 + 冻结区块 */
await goto('/dashboard', 1800)
{
  await cdp.eval(`(() => {
    const t = [...document.querySelectorAll('.lwg-tab')].find(e => e.textContent.includes('灵脉账务'));
    t && t.click(); return !!t;
  })()`)
  await sleep(2200)
  await shot('09-dashboard-finance')

  const st = await cdp.eval(`(() => ({
    canvases: document.querySelectorAll('.echarts-box canvas').length,
    frozen: !!document.querySelector('.frozen'),
    frozenText: (document.querySelector('.frozen')||{}).innerText?.replace(/\\n/g,' ').trim().slice(0, 110) || '',
    radioLabels: [...document.querySelectorAll('.el-radio-button__inner')].map(e => e.textContent.trim())
  }))()`)
  record('DASH', st.canvases >= 2, `ECharts canvas 数=${st.canvases}`)
  record('FROZEN', st.frozen, `「冻结中」区块已渲染：${st.frozenText}`)
  record('FROZEN', st.radioLabels.includes('内部流转'),
    `流水筛选文案=${JSON.stringify(st.radioLabels)}（locked 不再叫「冻结」）`)

  const errBefore = consoleErrors.length
  await cdp.eval(`document.querySelector('.nav__item[href="/mission-hall"]').click()`)
  await sleep(900)
  const detached = await cdp.eval(`(() => ({
    path: location.pathname,
    canvases: document.querySelectorAll('.echarts-box canvas').length
  }))()`)
  for (const [w, h] of [[1200, 800], [1000, 700], [1400, 900], [900, 700], [1100, 800]]) {
    await setViewport(w, h)
    await sleep(240)
  }
  const newErrs = consoleErrors.slice(errBefore)
  record('AC9', newErrs.length === 0 && detached.canvases === 0,
    `切到 ${detached.path} 后旧 canvas 残留=${detached.canvases}；连续 5 次 resize 新增报错 ${newErrs.length}${newErrs.length ? '：' + newErrs[0] : ''}`)
}

/* 收尾截图 */
await setViewport(1440, 960)
await goto('/login')
await shot('10-login-1440')
await setViewport(375, 812, true)
await goto('/login')
await checkNoHScroll('375px 登录页')
await shot('11-login-375')

/* AC6 全程无 JS 报错 */
{
  const relevant = consoleErrors.filter((e) => !/favicon/i.test(e))
  record('AC6', relevant.length === 0,
    `全程 console.error / 未捕获异常 ${relevant.length} 条${relevant.length ? '：\n        - ' + relevant.slice(0, 8).join('\n        - ') : ''}`)
}

/* ------------------------------------------------------------------ */
/* 汇总                                                               */
/* ------------------------------------------------------------------ */
const failed = results.filter((r) => !r.ok)
console.log('\n================ 自测汇总 ================')
const byId = {}
for (const r of results) {
  byId[r.id] = byId[r.id] || { pass: 0, fail: 0 }
  r.ok ? byId[r.id].pass++ : byId[r.id].fail++
}
for (const [id, v] of Object.entries(byId)) {
  console.log(`${v.fail === 0 ? '✔' : '✘'} ${id}: ${v.pass} 通过 / ${v.fail} 失败`)
}
console.log(`\n断言 ${results.length} 条，失败 ${failed.length} 条`)
console.log(`JS 报错 ${consoleErrors.length} 条`)
console.log(`截图与报告：artifacts/verify/`)

writeFileSync(join(OUT, 'report.json'), JSON.stringify({ base: BASE, results, consoleErrors }, null, 2))

cdp.ws.close()
killChrome()
await sleep(200)
process.exit(failed.length === 0 ? 0 : 1)
