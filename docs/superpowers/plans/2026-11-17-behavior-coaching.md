# Behavior coaching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 按题型诊断贡献、判断、结果与反思，保留单缺口训练闭环。
**Architecture:** 重整提示词优先级，避免统一追问结果；沿用 V1.1 JSON，新增三个行为题入口。首次与二次对比使用相同题型标准。
**Tech Stack:** React, Express, AJV, Node tests, DeepSeek.
**Spec:** 用户已确认的行为题优化方案；不实行固定 STAR 比例、强制数字或强制战略叙事。

## Global Constraints
文件留在 E 盘；不编造经历；不预测录用；无数字结果可有效；二答只验收原缺口；不新增依赖。

## Review Focus
团队叙述可有明确个人贡献；执行任务无需战略包装；决策题不可只问结果；失败题重视责任与后续调整；协作不要求个人获胜。

### Task 1: 规则与入口
Files: server/prompts.mjs, src/App.tsx, tests/e2e.spec.ts
- [x] 删除动作关键词强制追问结果规则，加入题型条件与单焦点检查。
- [x] 新增决策、失败、协作题，保持原题兼容与手机布局。

### Task 2: 验证与交付
Files: scripts/check-behavior.mjs, tests/behavior.json, docs/behavior-upgrade.md
- [x] 固定跨题型真实案例，检查状态和语义焦点、非数字结果与二答停止边界。
- [x] Node 测试、TypeScript、构建与手机桌面流程通过，记录真实模型自审结果。
- [x] 同步 GitHub，明确线上是否已更新。
