# 专注番茄

一个在浏览器里直接运行的番茄钟：计时、提醒、统计。纯前端、零构建、零依赖，双击 `index.html` 即可使用。

## 运行与测试

| 操作 | 方法 |
|---|---|
| 使用 | 双击 `index.html`(或拖进浏览器) |
| 跑测试 | 双击 `test.html`,全部绿色、标签标题显示 `✓ N/N` 即为通过 |
| 命令行快速检查(可选) | `node --check pomodoro-core.js`<br>`node -e "console.log(require('./pomodoro-core.js').formatTime(425000))"` → `07:05` |

如果某个浏览器在 `file://` 下表现异常(例如 Safari 的 localStorage),可以退回本地静态服务器：

```bash
python -m http.server 8765   # 端口被占用就换一个
# 然后访问 http://localhost:8765/
```

部署：把目录里的静态文件原样放到任意静态托管(如 GitHub Pages)即可，无需构建。

## 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 语言 | 原生 JavaScript(ES2020+) | 功能只有计时、提醒、统计，规模很小，不需要类型系统和编译 |
| 前端 | 原生 HTML / CSS / JS,无框架 | 浏览器直接打开就能运行 |
| 后端 | 无 | 不做登录、多用户、多端同步，逻辑全在浏览器 |
| 存储 | `localStorage` | 只存今日完成数、日期、计时状态等少量数据 |
| 测试 | `test.html` + 几十行自写断言 | 浏览器打开即可看结果，不引入构建工具和依赖 |
| 部署 | 静态文件 | 零运维 |

### 备选方案

- **Node 内置 `node --test`**:需要在命令行或 CI 自动跑测试时启用。`pomodoro-core.js` 末尾已经做了 `module.exports`,届时新建 `*.test.js` 直接 `require` 即可，不用改业务代码。
- **Playwright 端到端测试**:需要自动验证后台计时、标签标题等真实浏览器行为时再引入。代价是要装 Node 依赖，离开「零工具」约定。

### 已做的假设(待评审确认)

1. **不严格单文件**:除 `index.html` 外多一个 `pomodoro-core.js`。原因：在 `file://` 下 `test.html` 无法读取 `index.html` 的内联脚本(fetch 不可用、iframe 跨源),严格单文件只能把函数复制进测试，测试会和实现脱节。**这偏离了工作项「单个 index.html」的推荐，需评审拍板**;后续工作项都依赖这个结构。
2. **目标浏览器**:最新版桌面 Chrome、Edge、Safari(工作项原文范围),另加 Firefox。不支持 IE,不专门适配移动端。**Firefox 是否纳入需评审确认**,后台定时器节流的验证范围以确认结果为准。
3. **提醒声音**:用 Web Audio API 合成，不引入任何音频文件或 Base64。
4. **计时方式**:从一开始就按真实时间戳计算(见下文「计时规则」)。

## 目录与文件约定

```
index.html          页面：DOM 结构、样式、事件绑定、渲染、localStorage 读写
pomodoro-core.js    纯函数与常量：不碰 DOM、不读写 localStorage、不依赖当前时间
test.html           浏览器内测试，引入同一个 pomodoro-core.js
README.md           本文件
```

### 代码组织

- **纯逻辑放 `pomodoro-core.js`**:时间格式化、按时间戳算剩余时间、状态切换等。需要“现在”的函数把 `now` 作为参数传入，便于测试。
- **副作用放 `index.html`**:DOM 操作、定时器、`localStorage`、声音、`beforeunload` 等。
- `pomodoro-core.js` 以**普通脚本**加载，挂到 `window.Pomodoro`。**不要用 `<script type="module">`**:Chrome 在 `file://` 下会按 CORS 拦截 ES module。
- 新增纯函数时，同时在 `test.html` 补用例。
- 往页面写文本一律用 `textContent`,不用 `innerHTML`。
- 不引用任何外部资源(CDN、字体、图片)。

### 页面状态

`#app` 上挂一个状态 class,样式据此区分：

| class | 含义 |
|---|---|
| `is-idle` | 未开始 |
| `is-running` | 专注中 |
| `is-paused` | 已暂停 |

### 计时规则

后台标签页的 `setInterval` / `setTimeout` 会被浏览器节流，所以：

- 开始时记录结束时间戳 `endAt = Date.now() + 剩余毫秒`;
- 剩余时间一律用 `endAt - Date.now()` 计算，**不靠每秒减 1**;
- 定时器只负责“刷新显示”,不负责“记时”;
- 显示时剩余毫秒按秒**向上取整**(还剩 999ms 显示 `00:01`)。

## localStorage 键名规范

- 统一前缀 `zzfq.` + 小驼峰，前缀常量为 `Pomodoro.STORAGE_PREFIX`。
  在 `file://` 下 Chrome 的所有本地页面共用同一份 localStorage,必须加前缀避免冲突。
- 值统一 `JSON.stringify` 后存储，读取时 `try/catch` 兜底，解析失败按“无数据”处理。

| 键 | 值 | 说明 |
|---|---|---|
| `zzfq.todayCount` | number | 今日完成的番茄数 |
| `zzfq.todayDate` | string `YYYY-MM-DD` | `todayCount` 对应的本地日期，跨天时清零 |
| `zzfq.timerState` | object | 当前计时状态(如 `{ status, endAt, remainingMs }`),用于刷新后恢复 |

新增键时先在此表登记。
