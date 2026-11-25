# 步骤导航最小改造计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 分离查看步骤和训练进度，返回保留内容且不调用AI。
**Architecture:** App 继续持有训练状态，新增可进入进度和编辑查看标记；Recorder以可选父状态保存Blob，重挂载可回听。实际内容变更确认后仅使相关下游结果失效。
**Tech Stack:** React/TypeScript、Playwright。
**Spec:** 本轮用户步骤导航需求；直接执行本地，不推送部署。

## Global Constraints
不新增页面、API、依赖，不修改Prompt。

## Review Focus
- 未诊断不能跳到补充页。
- 单纯往返不调用AI、不丢录音或结果。
- 取消编辑确认保持全部数据。
- 确认上游修改后下游状态不能继续冒充有效结果。
- 手机无侧栏时上一步和现有前进可往返。

### Task 1
Files: src/App.tsx、src/Recorder.tsx、src/styles.css、tests/e2e.spec.ts。
- [x] 分离stage与可进入进度，实现按钮导航和手机上一步。
- [x] 保留录音，内容修改确认后按依赖清理，返回不自动生成。
- [x] 新增往返/取消确认/失效/录音回听回归，运行现有测试与构建。
