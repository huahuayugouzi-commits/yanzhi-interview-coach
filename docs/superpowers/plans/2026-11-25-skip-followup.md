# 追问必要性与跳过重说实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 仅必要证据缺口触发追问，用户可跳过进入自主重说。
**Architecture:** 复用现有null追问/空补充Guidance契约；App记录跳过模式用于重试与Compare，不修改Schema。保留诊断、导航与草稿。
**Tech Stack:** React、Node、AJV、Playwright。
**Spec:** 本轮用户要求；末尾明确授权测试后推送GitHub并部署现有Render Free，优先于前句不部署。不调用付费模型。

## Global Constraints
无新页面、接口、依赖或工作流重构；保留现有训练理念与UI。

## Review Focus
- 延伸深挖不可冒充本题必要缺口。
- 真实能力证据不足仍允许单问题追问。
- 跳过不发送未提交补充、不伪造结果或声称缺口消失。
- 跳过失败重试、导航往返与Compare不恢复强制追问。
- 工具/技术仅依据题目与真实原文，不限定回答路线。

### Task 1
Files: server/prompts.mjs、src/App.tsx、tests/skip-followup.test.mjs、tests/e2e.spec.ts。
- [ ] 增加Prompt必要性判断及开放思路，沿用现有JSON字段。
- [ ] 首次追问卡片和补充页加入跳过入口，复用无追问Guidance与Compare。
- [ ] 补充契约/Mock/桌面手机回归，运行现有测试和构建。
- [ ] 检查发布文件与隐私，推送main、Render Free部署并进行无费用线上检查。
