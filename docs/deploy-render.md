# Render 免费试用部署

本应用使用单个 Node Web Service 同时提供前端和 API，不需要数据库。

## 配置

仓库根目录包含 render.yaml，明确 plan: free，关闭自动发布。Render 注册/登录和 GitHub 授权需要账户本人完成。不要向聊天、源码仓库或上传包粘贴密钥。

1. 把项目源码推送到自己的私有 GitHub 仓库（排除 .env、录音、work、缓存和 node_modules）。
2. Render 选择 New → Blueprint，连接该仓库并核对创建的是 Free Web Service。若方案要求收费，停止并返回检查配置。
3. 配置 LLM_API_KEY。默认 DeepSeek；若本地使用其他服务，同步 LLM_BASE_URL 和 LLM_MODEL。
4. ACCESS_CODE 会随机生成；在服务 Environment 中查看并私下发给试用者，不能使用模型密钥当口令。生产环境缺少至少 12 字符口令时会拒绝启动。
5. 可选配置 ASR_API_KEY、ASR_BASE_URL、ASR_MODEL；没有语音凭证时保留文字输入和录音回听模式，不显示已完成转录。
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
- 访问口令是小范围邀请试用保护，不是多用户账户系统；口令可由使用者转发。需要广泛公开时再接正式用户鉴权。
- Free 服务空闲 15 分钟会休眠，唤醒约一分钟；每工作区每月 750 实例小时，还受流量、构建及对外 API 流量约束。不要以定时请求绕过休眠。
- HTTPS 是手机麦克风工作的必要条件。浏览器假设备测试不替代 iPhone Safari 真机录音验收。
- 本地草稿保存在各自浏览器，平台不会保存简历或音频。服务商的数据处理政策仍需向试用者说明。

参考：[免费实例限制](https://render.com/docs/free)、[Blueprint 字段](https://render.com/docs/blueprint-spec)、[Web Service](https://render.com/docs/web-services)。

## 本地部署材料

运行 node scripts/package-release.mjs 生成 release/source，使用显式允许列表打包并扫描是否包含本机配置的真实密钥。该目录不包括 .env；release/manifest.json 只记录扫描结论。

上线状态必须以 Render 实际部署成功返回的 HTTPS 网址和公网验收为准，准备文件或完成本地测试不算已上线。
