# 言之 · AI 面试表达教练

5–10 分钟完成「岗位准备 → 首次回答 → 一个关键追问 → 重说 → 前后对比」。支持文字输入、录音和真实语音转录；D「柔光系统」优先适配 iPhone 393×852。

React + Vite + TypeScript / Node.js + Express / AJV。无数据库，无生产 Mock。**目前仅本地开发，尚未上线。上传 GitHub 不会发布网站。**

## 另一台电脑首次启动

准备 Git 和 Node.js 24（项目最低 Node.js 22.12），在希望存放代码的磁盘执行：

```powershell
git clone https://github.com/huahuayugouzi-commits/yanzhi-interview-coach.git
cd yanzhi-interview-coach
npx --yes pnpm@11.25.0 install --frozen-lockfile
Copy-Item .env.example .env
```

私有仓库需要登录有权限的 GitHub 账户。安装命令使用锁定的依赖版本，不必安装全局 pnpm。

用文本编辑器填写本机 `.env`：

```env
LLM_API_KEY=你的DeepSeek密钥
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
ASR_API_KEY=你的硅基流动密钥
ASR_BASE_URL=https://api.siliconflow.cn/v1
ASR_MODEL=FunAudioLLM/SenseVoiceSmall
```

密钥不会通过 GitHub 同步，两台电脑分别配置。不要把真实密钥提交到仓库或写进前端。ASR 不填仍可手动输入和录音回听；LLM 不填会提示配置，不会生成演示诊断。其他兼容服务须同时修改密钥、地址和模型。修改后重启。

开发模式：

```powershell
npx --yes pnpm@11.25.0 run dev
```

打开 http://127.0.0.1:5173 ，API 在 3001。修改后端端口需同步修改 vite.config.js 中的代理。

构建后运行：

```powershell
npx --yes pnpm@11.25.0 run build
npx --yes pnpm@11.25.0 start
```

打开 http://127.0.0.1:3001 。Windows 构建后也可双击 start.cmd。不要同时运行两个占用 3001 的实例。

`.npmrc` 使用项目内相对路径保存 pnpm 缓存，可以放在另一台电脑的任意目录。`start.ps1` 将临时目录放入 work/tmp。标准 Node.js 安装提供 npm/npx；当前电脑如仅有已有 Codex 运行时，可使用该运行时的 pnpm CLI 执行 package.json 中的命令。

## 两台电脑同步

开始工作前：

```powershell
git pull --ff-only
```

package.json 或 pnpm-lock.yaml 变化后重新执行安装命令。完成修改后：

```powershell
git add .
git commit -m "描述本次修改"
git push
```

换电脑前先推送，另一台先拉取再修改。工作区有未提交修改时先提交或暂存；遇到冲突应解决，不要强制覆盖。

不会同步：`.env`、node_modules、构建产物、缓存、临时音频及浏览器本地草稿。

## 验证

```powershell
npx --yes pnpm@11.25.0 test
npx --yes pnpm@11.25.0 run build
npx --yes pnpm@11.25.0 run test:e2e
# 以下会调用配置的真实模型，可能消耗账户额度：
npx --yes pnpm@11.25.0 run test:live
```

- 最近一次 API / 安全测试 26/26 通过。
- 最近一次桌面 / 手机尺寸 Playwright 14/14 通过，自动启动独立 3003/3004 测试服务，不使用本机模型密钥。成功反馈和 ASR 文本使用 Mock；要求电脑安装 Edge，不自动下载浏览器。
- 真实模型 10 组黄金、5 组自然对话和二答对比已由 Codex 逐条检查，不是独立人工认证，也不保证未见输入全正确。详见 docs/evaluation/latest.json。
- 真实 ASR 于 2026-11-17 通过 WAV 合成语音和浏览器录音到真实 API 的测试，转录可编辑。未使用用户声音，不等于 iPhone Safari 真机认证。详见 docs/asr-validation-2026-11-17.md。
- ASR 复测脚本依赖未上传的 work/asr-check.wav 合成音频；异机需自行提供测试音频，不影响应用启动和常规测试。

`test:live` 会覆盖最新评测为待审核状态。Schema 和引文由代码验证；事实、主要缺口和自然感仍需逐条审核，不能把 Mock 或状态命中当作真实模型质量证明。

## 文件与数据

- src/：三个视图、D 主题、录音与可编辑文字。
- server/：提示词、AJV 校验、模型和 ASR 代理、试用口令与限流。
- schemas/：独立诊断和二答对比 JSON Schema。
- tests/：黄金/自然案例、API 与浏览器测试。
- POST /api/diagnose：job_title、job_description、resume、question、answer。
- POST /api/compare：上述字段 + second_answer、guiding_question（可 null）。
- POST /api/transcribe：multipart 字段 audio，最多 15MB；录音最多 3 分钟。
- GET /api/health：仅返回配置是否存在，不返回密钥。

密钥只在服务端，不使用 VITE_ 前缀。提交诊断时 JD、简历和回答会发送至模型服务；点击转录时音频发送至语音服务。请移除不必要的个人信息。服务不记录简历、回答、音频或密钥。录音只在内存；文字默认仅当前页面，勾选保存后写浏览器 localStorage，关闭保存或结束清除会删除草稿。第三方处理政策取决于所选服务。

## 部署材料

当前没有线上服务。render.yaml 明确免费计划且关闭自动部署；部署需另行授权，不能上传 `.env`。生产必须 HTTPS，ACCESS_CODE 至少 12 字符。默认每 IP 每小时 20 次、单实例每 UTC 日 100 次；内存计数重启会重置，不是账单硬上限。模型格式不合规时最多额外请求一次。详见 docs/deploy-render.md。

开源参考与许可证见 docs/third-party-review.md。
