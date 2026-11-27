# 独立邀请码管理

邀请码属于持有者凭证：每名测试者一条，不公开分享清单。默认20条、每码30次服务请求，首次核验起14天有效，创建后30天内需启用。诊断、Guidance、Compare、ASR共用额度；请求开始后失败仍计数。一次诊断服务请求可能因JSON修复产生最多2次模型调用，因此30次额度不等于30次供应商调用，也不是固定人民币费用。

## 初始化与发布

1. 本地执行 `node --env-file-if-exists=.env scripts/generate-invites.mjs 20`，只生成到项目 `work/invitations/<批次>/`；不要对同一数据库重复初始化或覆盖网关。
2. 审阅公开迁移 `supabase/invitations.sql` 和批次私有 `setup-private.sql`。后者含哈希，不能发给测试者；在现有Supabase项目的SQL Editor运行一次。
3. 将批次 `render-invites.env` 中4项导入Render：AUTH_MODE=invite、项目URL、publishable key、INVITE_GATEWAY_SECRET。保留LLM/ASR配置，绝不使用service_role。网关为独立随机服务器秘密，不是用户邀请码，不放前端。
4. 重新部署同一提交并验证health的auth_mode=invite；无/错/旧共享口令应401。数据库不可用应503且不调用模型，不回退到共享口令。
5. 真实数据库执行与并发、重启持久性要单独验收；Node Mock不证明真实SQL已执行。未完成初始化和上线前，不分发邀请码。

私有表有RLS且撤销anon/authenticated直接读写权限；唯一公开RPC固定search_path，先验证网关秘密，再核验邀请码哈希，锁定全站预算及码记录后原子扣减。Supabase仅保存编号、哈希、有效期、用量，不保存JD、回答或录音。首次成功登录即激活有效期；登录与无效输入不消耗请求额度。

全站每日持久上限默认100次（UTC日），并保留原有IP/每码小时内存限额。单实例重启可能重置小时限额，但每码总额与每日持久限额不会重置。旧code和supabase模式仍兼容；invite模式不接受旧ACCESS_CODE绕过。

## 查看及单独停用（仅管理员SQL Editor）

```sql
select id,enabled,call_limit,used,call_limit-used as remaining,activated_at,expires_at
from coach_invite_private.codes order by id;

-- 仅停用所选编号，不删除历史用量。
update coach_invite_private.codes set enabled=false where id='T01';
```

未启用的邀请码可在分发前调整额度：`update coach_invite_private.codes set call_limit=30 where id='T01';`。不得将call_limit降到used之下。延长已启用有效期或重置额度属于新的费用授权，应明确决定后再做；默认不自动续期或补额。

邀请码页面仅在标签页sessionStorage保存码；自愿保存的文字草稿按邀请码编号隔离于localStorage，录音仍只在当前页内存。每个请求的额度先保守预留，再执行服务；断网或上游失败不自动退额，避免超支。

## 验证边界

自动化覆盖无/错/共享口令拒绝、独立额度、过期停用、耗尽、重启模拟、并发模拟、无效输入、ASR共额、后端故障拒绝和前端草稿隔离。真实数据库并发与停用传播、Render重新部署持久性需要部署阶段单独记录。测试不调用真实付费模型。

安全依据：[Supabase数据库函数权限](https://supabase.com/docs/guides/database/functions)、[Data API安全](https://supabase.com/docs/guides/api/securing-your-api)。
