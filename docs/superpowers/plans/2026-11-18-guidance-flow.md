# 补充后提炼框架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 诊断追问后先补充真实信息，再提炼框架与关键词，用户自主重说后对比。
**Architecture:** 复用阶段2增加补充/引导子状态；新增受保护的 guidance API 与独立 schema；保留诊断和对比接口兼容。
**Tech Stack:** React/TypeScript, Express, AJV, Node test, Playwright。
**Spec:** 本次用户确认的流程与前一轮只读排查。

## Global Constraints
文件在 E 盘；不部署或调用付费模型；复用卡片样式；不编造内容或生成范文；旧草稿保持可恢复。

## Review Focus
引导失败保留补充；修改补充清除过期框架与最终答；clear 可自愿重练；引用只来自真实输入；新接口必须鉴权限流。

### Task 1: 引导契约和生成
- [x] 在 server/contracts.mjs、coach.mjs、prompts.mjs、app.mjs 增加 guidance 输入与输出、引用校验、路由和保护。
- [x] 首次诊断不提前生成框架，comparison 继续只比较首次与最终重说。
- [x] Node 测试覆盖真实引文、输入限长、无凭证、鉴权限流及 mock 模型传输。

### Task 2: 页面流程
- [x] 在 src/App.tsx 保留现有卡片，增加补充输入、提炼引导、独立框架/关键词/提示展示及最终重说。
- [x] 清除与修改时同步失效旧框架；失败保留输入。
- [x] 手机桌面 e2e 验证三个入口完整闭环和错误恢复，构建、导出 schema 并写明验收限制。
