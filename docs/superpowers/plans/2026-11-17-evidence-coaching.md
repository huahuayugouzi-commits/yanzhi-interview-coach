# Evidence coaching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 将复述型诊断升级为有原文依据的能力证据诊断与原缺口验收。
**Architecture:** 保留一次一个追问，扩展严格 JSON 与 UI；取消关键词触发 clear 的停止条件。二答只围绕原追问验收。
**Tech Stack:** React/TypeScript, Express, AJV, Node tests, Playwright.
**Spec:** 用户本次请求及 docs/diagnosis-upgrade.md。

## Global Constraints
所有文件留在 E 盘；不编造业务数字；不预测录用；保留有效非数字结果；不上传凭证。

## Review Focus
工作清单不能自动 clear；具体内部验证不能被无端否定；空内容不虚构原文；二答补充无需重述；解决原缺口后不换标准。

### Task 1: 诊断契约与规则
Files: server/prompts.mjs, server/contracts.mjs, tests/api.test.mjs, tests/security.test.mjs
- [x] 扩展 capability_focus、evidence_assessment、issue_impact；needs_retry 强制原文依据。
- [x] 修改 clear 规则与原缺口验收规则，升级 mock 契约。
- [x] 运行 Node 测试与真实模型案例，检查清晰充分与泛泛主张的边界。

### Task 2: 展示与验证
Files: src/App.tsx, tests/e2e.spec.ts, scripts/check-evidence.mjs, docs/diagnosis-upgrade.md
- [x] 展示能力焦点、证据完整度与缺口影响，移除笼统的表达已经清楚。
- [x] 桌面及手机验证完整流程、真实模型对比补充验收，构建并同步 GitHub。
