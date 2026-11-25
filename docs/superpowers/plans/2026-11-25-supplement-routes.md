# 两类补充入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补充回答和回答追问都进入现有下一步，但展示各自依据。
**Architecture:** App增加轻量补充模式；建议模式传null追问、实际补充，追问模式保留原问题。复用全部契约与组件，切换模式时确认受影响内容。
**Tech Stack:** React、TypeScript、Playwright。
**Spec:** 本轮用户要求最小修改并发布线上。

## Global Constraints
不新增API/依赖/页面，不调用付费模型，保留导航与原始回答。

## Review Focus
建议模式不误显示追问；实际补充进入Guidance；切换模式不混用旧结果；无修改返回不调用AI；原答编辑仍可从展开详情进入。

### Task 1
Files: src/App.tsx、tests/e2e.spec.ts。
- [x] 拆分两个入口依据，保留既有生成、重试与Compare。
- [x] 回归两条路线及现有导航，检查构建。
- [ ] 测试通过后推送并部署现有Render Free，线上无费用验收。
