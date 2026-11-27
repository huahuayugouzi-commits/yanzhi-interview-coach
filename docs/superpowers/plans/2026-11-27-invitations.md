# 20人独立邀请码实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 20个可独立停用、14天有效、30次服务请求额度的邀请码，控制测试费用。
**Architecture:** 新增invite鉴权模式，复用X-Access-Code和现有训练API。Supabase私有表保存哈希与原子额度；仅暴露受服务器随机网关密钥保护的RPC，不使用service_role。数据库故障拒绝模型请求；Render重启不重置总额度。
**Tech Stack:** Node、Express、React、Supabase PostgreSQL RPC；无新增依赖。
**Spec:** 用户“正式邀请20人测试，独立邀请码、有效期、调用额度”要求。默认首次使用14天，每码30次服务请求，30天内启用；每日全站100次持久上限。失败请求占额度，模型修复最多2次真实调用/服务请求。无付费模型验收。

## Global Constraints
所有私密文件仅在E盘work/invitations，禁止提交邀请码、网关秘密、.env或用户私密内容。保持code/supabase旧模式兼容。上线invite模式不得接受旧共享口令绕过。

## Review Focus
- 过期、停用、耗尽、错误码拒绝，重启后不能重置额度。
- 并发仅可消费剩余额度，非法输入不消耗持久总额度。
- 网关密钥不符、数据库故障、异常响应均拒绝，不回退共享口令。
- 表不可anon/authenticated读取；函数仅可在随机网关密钥+邀请码哈希双重验证后访问。
- 每码额度覆盖模型和ASR，前端不泄漏秘密，邀请清单不进入Git。

### Task 1
Files: server/invites.mjs、server/app.mjs、server/index.mjs、server/access.mjs、src/App.tsx、src/api.ts、supabase/invitations.sql、scripts/generate-invites.mjs、tests/invites.test.mjs。
- [x] 实现RPC鉴权/原子消费、输入后消费、生产配置关闭失败。
- [x] 复用邀请码输入并显示剩余额度，保留其他鉴权模式。
- [x] 生成20份私密清单与数据库初始化文件、管理说明，保护Git忽略。
- [x] 运行契约、安全、浏览器与构建，真实数据库验收单列。
- [ ] 完成可审阅变更后，请求浏览器安全权限确认：在Supabase建立受限RPC并启用20个邀请码、将服务器网关秘密保存至Render。获准后执行配置、上线并无费用验收。
