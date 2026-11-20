# Render 免费试用部署

本应用使用单个 Node Web Service 同时提供前端和 API。共享口令模式不需要数据库；独立账号模式使用 Supabase Auth 持久保存账号，不使用 Render 临时文件系统保存账号。

## 配置

仓库根目录包含 render.yaml，明确 plan: free，关闭自动发布。Render 注册/登录和 GitHub 授权需要账户本人完成。不要向聊天、源码仓库或上传包粘贴密钥。

1. 把项目源码推送到自己的私有 GitHub 仓库（排除 .env、录音、work、缓存和 node_modules）。
2. Render 选择 New → Blueprint，连接该仓库并核对创建的是 Free Web Service。若方案要求收费，停止并返回检查配置。
3. 配置 LLM_API_KEY。默认 DeepSeek；若本地使用其他服务，同步 LLM_BASE_URL 和 LLM_MODEL。
4. 默认 `AUTH_MODE=code` 时，ACCESS_CODE 会随机生成；生产环境口令至少 12 字符。迁移到独立账号使用下文步骤；账号模式中旧口令不能进入训练 API。
5. Blueprint 会同时要求配置 ASR_API_KEY，默认使用 SiliconFlow 的 FunAudioLLM/SenseVoiceSmall。填入本地已验收的语音密钥；不要上传 .env。手工创建服务时也要添加 ASR_BASE_URL=https://api.siliconflow.cn/v1 和 ASR_MODEL=FunAudioLLM/SenseVoiceSmall。没有语音凭证时仍可使用文字输入和录音回听。
6. 首次部署完成后，检查 HTTPS 地址的 /api/health，然后验证无口令不能调用训练 API、正确口令可完成真实训练。

如手工创建 Web Service：

- Runtime: Node
- Build: npx --yes pnpm@11.25.0 install --frozen-lockfile && npx --yes pnpm@11.25.0 run build
- Start: node server/index.mjs
- Health path: /api/health
- Plan: Free
- NODE_VERSION=24.22.1, NODE_ENV=production, HOST=0.0.0.0
- 其他环境变量参见 .env.example；不要上传本地 .env。

## 费用与访问边界

- 免费托管不包含模型或语音调用费用。优先不绑定支付方式，并在服务商账户设置消费上限。
- 试用限制默认每 IP 每小时 20 次、单实例每天 100 次（UTC 日界）。记录存在内存中，休眠/重启会重置，不是账单硬上限。格式修复最多额外调用模型一次，因此一次训练请求可能对应两次模型调用。
- 共享口令只适合小范围邀请试用。独立账号模式使用邮箱和密码；不开放公众自助注册。
- Free 服务空闲 15 分钟会休眠，唤醒约一分钟；每工作区每月 750 实例小时，还受流量、构建及对外 API 流量约束。不要以定时请求绕过休眠。
- HTTPS 是手机麦克风工作的必要条件。浏览器假设备测试不替代 iPhone Safari 真机录音验收。
- 本地草稿保存在各自浏览器，平台不会保存简历或音频。服务商的数据处理政策仍需向试用者说明。

参考：[免费实例限制](https://render.com/docs/free)、[Blueprint 字段](https://render.com/docs/blueprint-spec)、[Web Service](https://render.com/docs/web-services)。

## 本地部署材料

运行 node scripts/package-release.mjs 生成 release/source，使用显式允许列表打包并扫描是否包含本机配置的真实密钥。该目录不包括 .env；release/manifest.json 只记录扫描结论。

上线状态必须以 Render 实际部署成功返回的 HTTPS 网址和公网验收为准，准备文件或完成本地测试不算已上线。

## 独立账号登录（Supabase Free + 现有 Render Free）

1. 在自己的 Supabase 账号内创建 **Free** 项目，保存好数据库密码。网站代码不需要数据库管理密码，也不需要 service_role/secret key。
2. Authentication → Sign In / Providers：启用 Email 密码登录，关闭 **Allow new users to sign up**（邀请制）。无需启用短信、第三方登录或付费邮件服务。
3. Authentication → Users → Add user → Create new user：本人设置邮箱和强密码，勾选确认邮箱（Auto confirm user）。由管理员私下交付账号，不要把密码贴进聊天、GitHub 或测试报告。忘记密码本轮由管理员在后台处理；网站不提供自助注册/重置密码页。
4. 从 Project Settings / Data API 获取 **Project URL**，从 API Keys 获取 **Publishable key**（旧项目可用 anon key）。在 Render 服务的 **Environment** 添加：
   - `AUTH_MODE=supabase`
   - `SUPABASE_URL=https://<project-ref>.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY=<publishable 或 legacy anon key>`
   - 保留原 LLM、ASR、NODE_ENV 和限流设置。原 ACCESS_CODE 可保留但不再作为训练通行证。
5. 凭证只填服务环境变量或本地被忽略的 `.env`，不添加 `VITE_` 前缀。确认服务仍为 **Free**。配置必须与账号版代码一起发布；旧部署不会识别新登录接口。
6. Manual Deploy → Deploy latest commit。上线后 `/api/health` 应为 `auth_mode=supabase`、`auth_configured=true`。首页无需登录，`/train` 显示邮箱和密码。
7. 无登录 cookie 的 `/api/diagnose`、`/api/guidance`、`/api/compare`、`/api/transcribe` 和 `/api/access` 应返回 401 ACCOUNT_REQUIRED。只有共享口令不能绕过。
8. 由账号本人验收真实登录→刷新→退出。不需要提交诊断，因此登录验收不产生模型费用。浏览器测试中的本地模拟账号不是线上账号验收。

### 会话、数据与费用边界

- 密码交给 Supabase Auth 校验，本站不记录密码、不建账号表、不持久保存密码。登录响应只返回账号 ID 和邮箱。
- 生产会话使用 `__Host-coach_session` Cookie，Secure、HttpOnly、SameSite=Strict、Path=/，寿命不超过 Supabase access token 的 `expires_in`，且最多 1 小时。不保存或使用 refresh token；到期重新登录。同一页面重新登录同一账号可继续当前文字回答。
- 每次受保护请求经 Supabase `/auth/v1/user` 验证，不相信浏览器传来的账号 ID。退出删除本机 cookie，并尽力请求 Supabase local-scope sign-out。服务中断时仍清除本机 cookie；已被复制的 access token 不保证立即失效，以提供商 JWT 过期时间为界。
- 登录失败信息统一；每 IP 15 分钟最多 10 次尝试。训练同时保留每 IP/账号每小时及全站每日限流；计数在内存中，重启会重置，不是账单硬上限。
- 草稿仍只在用户勾选时保存到本机，并按账号 ID 分开；退出删除该账号本机草稿。不会自动迁移此前共享口令的旧草稿，也没有云端历史记录。共用设备应退出登录；本地草稿不是加密保险库。
- Supabase 免费额度及空闲暂停政策、Render Free 休眠与带宽限制以官方当日说明为准；不自动升级套餐。AI 与语音费用仍由原服务产生。
- 暂未涉及账号设置、自动刷新登录、自助改密、邮件发送和训练记录数据库。

参考：[Supabase 费用](https://supabase.com/pricing)、[密码登录](https://supabase.com/docs/guides/auth/passwords)、[会话与退出边界](https://supabase.com/docs/guides/auth/sessions)。
